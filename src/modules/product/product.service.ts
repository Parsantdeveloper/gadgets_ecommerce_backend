import { ConflictError } from "@/utils/error.js";
import { CreateProductPayload, UpdateProductPayload, UpdateProductVariantPayload, ProductVariant, GetProductsQuery } from "./product.schema.js";
import productRepository from "./product.repository.js";
import redis from "../../libs/redis.js";
import { updateImageName } from "@/modules/uploads/uploads.controller.js";

// ─── Shared helper ───────────────────────────────────────────────────────────

// ─── Shared helper ───────────────────────────────────────────────────────────

type ImageInput = {     
    url: string;       // required, matches schema
    alt?: string;
    position?: number;
};

async function processImages(images: ImageInput[]): Promise<ImageInput[]> {
    if (!images || images.length === 0) return [];

    return Promise.all(
        images.map(async (img) => {
            if (img.alt?.startsWith("temp/")) {
                const renamed = await updateImageName(img.alt);
                if (renamed) {
                    return {
                        url: renamed.secure_url,  // replaces the temp url
                        alt: renamed.public_id,
                        position: img.position,
                    };
                }
            }
            return img;
        })
    );
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ProductService {
    async createProduct(data: CreateProductPayload) {
        const existingProduct = await productRepository.findByName(data.product.name);
        if (existingProduct) {
            throw new ConflictError("Product with the same name already exists");
        }

        // Process images per-variant (note: was a bug before — newImages wasn't reset each iteration)
        for (const variant of data.variants) {
            variant.images = await processImages(variant.images ?? []);
        }

        const product = await productRepository.createFirstProduct(data);
        if (!product) {
            throw new Error("Failed to create product");
        }
        return product;
    }

    async getProductBySlug(slug: string) {
        const cacheKey = `product:${slug}`;
        try {
            const cachedProduct = await redis.get(cacheKey);
            if (cachedProduct) return JSON.parse(cachedProduct);

            const product = await productRepository.findBySlug(slug);
            if (!product) throw new ConflictError("Product not found");

            await redis.set(cacheKey, JSON.stringify(product), "EX", 300);
            return product;
        } catch (error) {
            throw error;
        }
    }

    async searchProducts(searchTerm: string) {
        const searchKey = `search:${searchTerm}`;
        try {
            const cachedResults = await redis.get(searchKey);
            if (cachedResults) return JSON.parse(cachedResults);

            const results = await productRepository.searchProducts(searchTerm);
            await redis.set(searchKey, JSON.stringify(results), "EX", 300);
            return results;
        } catch (error) {
            throw error;
        }
    }

    async updateProduct(id: string, data: UpdateProductPayload) {
        try {
            const updatedProduct = await productRepository.updateProduct(id, data);
            if (!updatedProduct) throw new Error("Failed to update product");

            await redis.del(`product:${updatedProduct.slug}`);
            return updatedProduct;
        } catch (error) {
            throw error;
        }
    }

    async updateProductVariant(slug: string, variantId: string, data: UpdateProductVariantPayload) {
        try {
            data.images = await processImages(data.images ?? []);

            const updatedProductVariant = await productRepository.updateProductVariant(variantId, data);
            if (!updatedProductVariant) throw new Error("Failed to update product variant");

            await redis.del(`product:${slug}`);
            return updatedProductVariant;
        } catch (error) {
            throw error;
        }
    }

    async createProductVariant(productId: string, data: ProductVariant) {
        try {
            data.images = await processImages(data.images ?? []);

            const productVariant = await productRepository.createProductVariant(productId, data);
            if (!productVariant) throw new Error("Failed to create product variant");

            await redis.del(`product:${productId}`);
            return productVariant;
        } catch (error) {
            throw error;
        }
    }

    async getProducts(query: GetProductsQuery) {
        try {
   
            const cacheKey = `products:${JSON.stringify(query)}`;
            const cachedResults = await redis.get(cacheKey);
            // if (cachedResults) return JSON.parse(cachedResults);

            const products = await productRepository.getProducts(query);
            await redis.set(cacheKey, JSON.stringify(products), "EX", 300);
            return products;
        } catch (error) {
            throw error;
        }
    }

    async getMetaForFilters() {
        const cacheKey = `product:filters:meta`;
        try {
            const cachedMeta = await redis.get(cacheKey);
            if (cachedMeta) return JSON.parse(cachedMeta);

            const meta = await productRepository.getMetaForFilters();
            await redis.set(cacheKey, JSON.stringify(meta), "EX", 300);
            return meta;
        } catch (error) {
            throw error;
        }
    }

    async getProductsForLandingPage() {
        const cacheKey = `product:landing:sections`;
        try {
            const cachedProducts = await redis.get(cacheKey);
            if (cachedProducts) return JSON.parse(cachedProducts);

            const products = await productRepository.getProductsForLandingPage();
            await redis.set(cacheKey, JSON.stringify(products), "EX", 300);
            return products;
        } catch (error) {
            throw error;
        }
    }

    async softDeleteProduct(id:string){
        try {
            const deletedProduct = await productRepository.softDeleteProduct(id);
            if (!deletedProduct) throw new Error("Failed to delete product");

            await redis.del(`product:${deletedProduct.slug}`);
            return deletedProduct;
        } catch (error) {
            throw error;
        }
    }

    async softDeleteProductVariant(id:string){
        try {
            const deletedVariant = await productRepository.softDeleteProductVariant(id);
            if (!deletedVariant) throw new Error("Failed to delete product variant");

            await redis.del(`product:${deletedVariant.productId}`);
            return deletedVariant;
        } catch (error) {
            throw error;
        }
    }

}

const productService = new ProductService();
export default productService;