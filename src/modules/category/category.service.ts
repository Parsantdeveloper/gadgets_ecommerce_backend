import { CreateCategoryInput, UpdateCategoryInput, CreateBulkCategoriesInput, CategoryNode } from "./category.schema.js";
import slug from "slug";
import prisma from "@/config/prisma.js";
import { ConflictError } from "@/utils/error.js";
import { GetCategoriesInput } from "./category.schema.js";
import { Prisma } from "@/generated/prisma/browser.js";
import { updateImageName } from "@/modules/uploads/uploads.controller.js";
import { destroyImage } from "@/libs/ImageDestroyer.js";
import redis from "@/libs/redis.js";
import productRepository from "../product/product.repository.js";
export class CategoryService {

  async getCategoryParentChild() {

     redis.get("category_parent_child").then((cached) => {
      if (cached) {
        console.log("Cache hit for category parent-child");
        return JSON.parse(cached);
      }
    }).catch((err) => {
      console.error("Redis error:", err);
    });
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    type CategoryTreeNode = {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      imageUrl: string | null;
      sortOrder: number;
      children: CategoryTreeNode[];
    };

    const nodesById = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const category of categories) {
      nodesById.set(category.id, {
        ...category,
        parentId: category.parentId ?? null,
        imageUrl: category.imageUrl ?? null,
        children: [],
      });
    }

    for (const category of categories) {
      const currentNode = nodesById.get(category.id)!;
      if (category.parentId && nodesById.has(category.parentId)) {
        nodesById.get(category.parentId)!.children.push(currentNode);
      } else {
        roots.push(currentNode);
      }
    }
    redis.set("category_parent_child", JSON.stringify(roots), "EX", 60 * 60).catch((err) => {
      console.error("Redis error:", err);
    });

    return roots;
  }

  async createCategory(input: CreateCategoryInput) {
    const { name } = input;
    const slugName = slug(name, { lower: true });

    const existing = await prisma.category.findUnique({ where: { slug: slugName } });
    if (existing) throw new ConflictError("Category already exists");

    let imageId: string | undefined
    let imageUrl: string | undefined

    if (input.imageId) {
      const image = await updateImageName(input.imageId);
      if (!image) throw new Error("Failed to process image");
      imageId = image.public_id;
      imageUrl = image.secure_url;
    }

    return prisma.category.create({
      data: { ...input, slug: slugName, imageId, imageUrl },
    });
  }

  async getCategories(input: GetCategoriesInput) {
    const { parentId, search, page, limit } = input;
    const where: Prisma.CategoryWhereInput = {
      ...(parentId != undefined && { parentId }),
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    }

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          imageUrl: true,
          sortOrder: true,
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getCategoryForLanding() {
    return prisma.category.findMany({
      where: { imageUrl: { not: null }, isActive: true },
      select: { id: true, name: true, slug: true, imageUrl: true },
      orderBy: { sortOrder: "asc" },
      take: 10,
    });
  }

  async updateCategory(input: UpdateCategoryInput) {
  const { id, data } = input;

  const existingCategory = await prisma.category.findUnique({
    where: { id },
    select: { imageId: true },
  });
  if (!existingCategory) throw new Error("Category not found");

  // Separate image fields from the rest of the payload
  const { imageId, imageUrl, ...restData } = data;

  let imageUpdate = {};
  if (imageId) {
    const updatedImage = await updateImageName(imageId);
    imageUpdate = {
      imageId: updatedImage.public_id,
      imageUrl: updatedImage.secure_url,
    };
  }
   console.log("Updating category with data:", { ...restData, ...imageUpdate });
  const category = await prisma.category.update({
    where: { id },
    // restData excludes imageId/imageUrl — imageUpdate provides the correct renamed values
    data: { ...restData, ...imageUpdate },
  });

  // Destroy old image only if it was replaced
  if (imageId && existingCategory.imageId && existingCategory.imageId !== category.imageId) {
    await destroyImage(existingCategory.imageId);
  }

  return category;
}

  async deleteCategory(id: string) {
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    if (!category) throw new Error("Category not found");

    return category;
  }

  // ─── Bulk / Nested ─────────────────────────────────────────────────────────

 async createBulkCategories(input: CreateBulkCategoriesInput) {
  const { parentId, categories } = input;

  // Collect every slug AND its original name for better error messages
  const collectSlugs = (
    nodes: CategoryNode[],
    acc: Array<{ slug: string; name: string }> = []
  ): Array<{ slug: string; name: string }> => {
    for (const node of nodes) {
      acc.push({ slug: slug(node.name, { lower: true }), name: node.name });
      if (node.children?.length) collectSlugs(node.children, acc);
    }
    return acc;
  };

  const allEntries = collectSlugs(categories);
  const allSlugs = allEntries.map((e) => e.slug);

  // ── 1. Check duplicates WITHIN the input payload ──────────────────────────
  const seenInPayload = new Map<string, string>(); // slug → original name
  const payloadDupes: string[] = [];

  for (const entry of allEntries) {
    if (seenInPayload.has(entry.slug)) {
      payloadDupes.push(`"${entry.name}" (slug: ${entry.slug})`);
    } else {
      seenInPayload.set(entry.slug, entry.name);
    }
  }

  if (payloadDupes.length > 0) {
    throw new ConflictError(
      `Duplicate names in your input:\n  • ${payloadDupes.join("\n  • ")}`
    );
  }

  // ── 2. Check duplicates AGAINST the DB ────────────────────────────────────
  const existingInDb = await prisma.category.findMany({
    where: { slug: { in: allSlugs } },
    select: { slug: true, name: true },
  });

  if (existingInDb.length > 0) {
    const dbDupes = existingInDb.map((c) => `"${c.name}" (slug: ${c.slug})`);
    throw new ConflictError(
      `These categories already exist in the database:\n  • ${dbDupes.join("\n  • ")}`
    );
  }

  // ── 3. Recursive writer ───────────────────────────────────────────────────
  const createRecursive = async (
    nodes: CategoryNode[],
    parentId: string
  ): Promise<object[]> => {
    return Promise.all(
      nodes.map(async (node) => {
        const created = await prisma.category.create({
          data: {
            name: node.name,
            slug: slug(node.name, { lower: true }),
            parentId,
          },
        });

        const children = node.children?.length
          ? await createRecursive(node.children, created.id)
          : [];

        return { ...created, children };
      })
    );
  };

  return createRecursive(categories, parentId);
}
}