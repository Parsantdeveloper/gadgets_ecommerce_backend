import prisma from "../../config/prisma.js";
import { CreateProductPayload, UpdateProductPayload, UpdateProductVariantPayload, UpdateProductSpecification, ProductVariant, GetProductsQuery } from "./product.schema.js";
import slug from "slug";
import generateSKU from "@/libs/skuGenerator.js";
import { SortOrder } from "@/generated/prisma/internal/prismaNamespace.js";
import { Prisma } from "@/generated/prisma/client.js";
import redis from "../../libs/redis.js";

// ── Stock status mapper ────────────────────────────────────────────────────────

function mapProductWithStockStatus<
  T extends { variants: { stockCount: number | null }[] }
>(product: T) {
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      isInStock: (v.stockCount ?? 0) > 0,
    })),
  };
}

class ProductRepository {

  // Given a single categoryId, returns that ID plus all direct children IDs.
  // Simple two-query approach — no recursive CTE needed.
  // Result is cached in Redis for 1 hour since category trees rarely change.

  async getCategoryWithDescendantIds(categoryId: string): Promise<string[]> {
    const cacheKey = `category:descendants:${categoryId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as string[];
    } catch {
      // fall through to DB
    }

    const children = await prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    const ids = [categoryId, ...children.map((c) => c.id)];

    try {
      await redis.set(cacheKey, JSON.stringify(ids), "EX", 3600);
    } catch {
      // non-fatal
    }

    return ids;
  }

  async invalidateCategoryDescendantsCache(categoryId: string): Promise<void> {
    try {
      await redis.del(`category:descendants:${categoryId}`);
    } catch {
      // non-fatal
    }
  }

  // ── Product CRUD ───────────────────────────────────────────────────────────

  async createFirstProduct(data: CreateProductPayload) {
    const product_slug = slug(data.product.name, { lower: true });
    const { product, variants, specifications } = data;

    const productRecord = await prisma.$transaction(async (tx) => {
      const new_product = await tx.product.create({
        data: {
          ...product,
          specifications: specifications || undefined,
          slug: product_slug,
        },
      });

      await Promise.all(
        variants.map((variant) =>
          tx.productVariant.create({
            data: {
              ...variant,
              productId: new_product.id,
              sku: generateSKU(product_slug, variant.attributes),
              attributes: variant.attributes ?? "undefined",
            },
          })
        )
      );

      return new_product;
    });

    return productRecord;
  }

  async findByName(name: string) {
    const product_slug = slug(name, { lower: true });
    return prisma.product.findUnique({ where: { slug: product_slug } });
  }

  async findBySlug(productSlug: string) {
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: productInclude,
    });
    if (!product) return null;
    return mapProductWithStockStatus(product);
  }

  async searchProducts(searchTerm: string) {
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
      },
      take: 10,
    });
  }

  async updateProduct(id: string, data: UpdateProductPayload) {
    const { name, description, categoryId, brandId, isActive, specifications } = data;
    return prisma.product.update({
      where: { id },
      data: { name, description, categoryId, brandId, isActive, specifications },
    });
  }

  async updateProductVariant(id: string, data: UpdateProductVariantPayload) {
    return prisma.productVariant.update({
      where: { id },
      data: { ...data, attributes: data.attributes || undefined },
    });
  }

  async createProductVariant(productId: string, data: ProductVariant) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!product) throw new Error("Product not found");

    return prisma.productVariant.create({
      data: {
        ...data,
        productId,
        sku: generateSKU(product.slug, data.attributes),
        attributes: data.attributes ?? undefined,
      },
    });
  }

  async softDeleteProductVariant(id: string) {
    return prisma.productVariant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getProducts(input: GetProductsQuery) {
    const {
      search,
      category,
      brand,
      isActive,
      page,
      limit,
      price,
      stock,
      minPrice,
      maxPrice,
      stockStatus,
    } = input;

    // If a single category is passed, expand it to include direct children
    // (e.g. "Laptop" also returns Gaming + Office laptop products).
    // If multiple categories are passed, use them as-is — the user already
    // selected specific categories so no expansion is needed.
    let expandedCategoryIds: string[] | undefined;
    if (category && category.length === 1) {
      expandedCategoryIds = await this.getCategoryWithDescendantIds(category[0]);
    } else if (category && category.length > 1) {
      expandedCategoryIds = category;
    }

    const whereClause: Prisma.ProductWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        expandedCategoryIds ? { categoryId: { in: expandedCategoryIds } } : {},
        brand ? { brandId: { in: brand } } : {},
        isActive !== undefined ? { isActive } : { isActive: true },

        minPrice !== undefined || maxPrice !== undefined
          ? {
              variants: {
                some: {
                  AND: [
                    minPrice !== undefined ? { price: { gte: minPrice } } : {},
                    maxPrice !== undefined ? { price: { lte: maxPrice } } : {},
                  ],
                },
              },
            }
          : {},

        stockStatus === "out_of_stock"
          ? { variants: { every: { stockCount: 0 } } }
          : stockStatus === "in_stock"
          ? { variants: { some: { stockCount: { gt: 10 } } } }
          : stockStatus === "low_stock"
          ? { variants: { some: { stockCount: { gt: 0, lte: 10 } } } }
          : {},
      ],
    };

    const needsRelationSort = price !== undefined || stock !== undefined;

    if (needsRelationSort) {
      return this.getProductsSortedByVariant({ whereClause, price, stock, page, limit });
    }

    const skip = (page - 1) * limit;

    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: productInclude,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const products = rawProducts.map(mapProductWithStockStatus);

    return buildResponse(products, totalCount, page, limit);
  }

  async getMetaForFilters() {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
      }),
    ]);
    return { categories, brands };
  }

  async softDeleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getProductsForLandingPage(){
    const gamingLaptop = await prisma.product.findMany({
        where:{isActive:true,
          categoryId:"f7025c20-f38b-4c46-a3ca-6928a8d90e8a"
        },
        include: productInclude, 
        take: 6
    })
    const smartphone = await prisma.product.findMany({
      where:{isActive:true,
        categoryId:"642b84b9-8bc1-45da-bfa3-cfe75a1cf352"
      },
      include: productInclude, 
      take: 6
    })
    const refrizrator = await prisma.product.findMany({
      where:{isActive:true,
        categoryId:"e2f071fb-e2b4-42b3-b80e-0b71fd4fffbd"
      },
      include: productInclude, 
      take: 6
    })

    return {
      gamingLaptop: gamingLaptop.map(mapProductWithStockStatus),
      smartphone: smartphone.map(mapProductWithStockStatus),
      refrigerator: refrizrator.map(mapProductWithStockStatus)
    }
  }

  private async getProductsSortedByVariant({
    whereClause,
    price,
    stock,
    page,
    limit,
  }: {
    whereClause: Prisma.ProductWhereInput;
    price?: SortOrder;
    stock?: SortOrder;
    page: number;
    limit: number;
  }) {
    // 1. Fetch all matching products with only the fields needed for sorting
    const productsWithAggregates = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        variants: {
          where: { isActive: true },
          select: { price: true, stockCount: true },
        },
      },
    });

    // 2. Compute sort key per product
    type SortableProduct = { id: string; sortPrice: number; sortStock: number };

    const sortable: SortableProduct[] = productsWithAggregates.map((p) => {
      const prices = p.variants.map((v) => Number(v.price));
      const stocks = p.variants.map((v) => v.stockCount ?? 0);
      return {
        id: p.id,
        sortPrice: prices.length ? Math.min(...prices) : Infinity,
        sortStock: stocks.reduce((a, b) => a + b, 0),
      };
    });

    // 3. Sort in-memory
    sortable.sort((a, b) => {
      if (price) {
        const diff =
          price === "asc" ? a.sortPrice - b.sortPrice : b.sortPrice - a.sortPrice;
        if (diff !== 0) return diff;
      }
      if (stock) {
        const diff =
          stock === "asc" ? a.sortStock - b.sortStock : b.sortStock - a.sortStock;
        if (diff !== 0) return diff;
      }
      return 0;
    });

    const totalCount = sortable.length;

    // 4. Slice the page
    const skip = (page - 1) * limit;
    const pageIds = sortable.slice(skip, skip + limit).map((p) => p.id);

    if (pageIds.length === 0) {
      return buildResponse([], totalCount, page, limit);
    }

    // 5. Fetch full data and preserve sorted order
    const rawProducts = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: productInclude,
    });

    const ordered = pageIds
      .map((id) => rawProducts.find((p) => p.id === id))
      .filter((p): p is typeof rawProducts[number] => p !== undefined)
      .map(mapProductWithStockStatus);

    return buildResponse(ordered, totalCount, page, limit);
  }
}

// ── Shared include ─────────────────────────────────────────────────────────────

const productInclude = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  brand: {
    select: { id: true, name: true, slug: true },
  },
  variants: {
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      price: true,
      salePrice: true,
      stockCount: true,
      attributes: true,
      dimensions: true,
      images: true,
    },
  },
} satisfies Prisma.ProductInclude;

// ── Response builder ───────────────────────────────────────────────────────────

function buildResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const productRepository = new ProductRepository();
export default productRepository;