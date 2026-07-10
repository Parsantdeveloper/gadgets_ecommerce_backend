import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(2).max(255),
    description: z.string().min(2).max(5000).optional(),
    categoryId: z.string().uuid("Invalid categoryId"),
    brandId: z.string().uuid("Invalid brandId"),
    isActive: z.boolean().default(true),
});

const variantAttributesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()])
);

export const productVariantSchema = z.object({
    price: z.coerce.number().positive(),
    salePrice: z.coerce.number().positive().optional(),
    stockCount: z.coerce.number().int().nonnegative(),

    attributes: variantAttributesSchema.optional(),
    images: z.array(
        z.object({
            url: z.string().url(),
            alt: z.string().optional(),
            position: z.coerce.number().int().nonnegative().optional(),
        })
    ).optional(),

    weight: z.coerce.number().positive().optional(),
    dimensions: z.object({
        length: z.coerce.number().positive(),
        width: z.coerce.number().positive(),
        height: z.coerce.number().positive(),
    }).optional(),

    isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.salePrice && data.salePrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale price cannot be greater than regular price",
        path: ["salePrice"]
      });
    }
  });

export const productSpecificationSchema = z.string().min(1);

export const createProductPayloadSchema = z.object({
    product: createProductSchema,
    variants: z.array(productVariantSchema).min(1),
    specifications: productSpecificationSchema.optional(),
})

export type CreateProductPayload = z.infer<typeof createProductPayloadSchema>;

export type ProductVariant = z.infer<typeof productVariantSchema>;

export const updateProductPayloadSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().min(2).max(5000).optional(),
    categoryId: z.string().uuid("Invalid categoryId").optional(),
    brandId: z.string().uuid("Invalid brandId").optional(),
    isActive: z.boolean().default(true).optional(),
    status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
    specifications: productSpecificationSchema.optional(),
})

export type UpdateProductPayload = z.infer<typeof updateProductPayloadSchema>;

export const updateProductVariantPayloadSchema = z.object({
    price: z.coerce.number().positive().optional(),
    salePrice: z.coerce.number().positive().optional(),
    stockCount: z.coerce.number().int().nonnegative().optional(),

    attributes: variantAttributesSchema.optional(),
    images: z.array(
        z.object({
            url: z.string().url(),
            alt: z.string().optional(),
            position: z.coerce.number().int().nonnegative().optional(),
        })
    ).optional(),

    weight: z.coerce.number().nonnegative().optional(),
    dimensions: z.object({
        length: z.coerce.number().nonnegative(),
        width: z.coerce.number().nonnegative(),
        height: z.coerce.number().nonnegative(),
    }).optional(),

    isActive: z.boolean().default(true).optional(),
}).superRefine((data, ctx) => {
    if (data.salePrice && data.price && data.salePrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale price cannot be greater than regular price",
        });
    }
    });

export type UpdateProductVariantPayload = z.infer<typeof updateProductVariantPayloadSchema>;

export const updateProductSpecificationPayloadSchema = z.object({
    key: z.string().min(1).max(100).optional(),
    value: z.string().min(1).max(500).optional(),
})

export type UpdateProductSpecification = z.infer<typeof updateProductSpecificationPayloadSchema>;


export const getProductsQuerySchema = z.object({
    search: z.string().min(1).max(255).optional(),
    category: z.preprocess(
    (val) => (Array.isArray(val) ? val : val ? [val] : undefined),
    z.array(z.string().uuid("Invalid category id")).optional()
  ),

  brand: z.preprocess(
    (val) => (Array.isArray(val) ? val : val ? [val] : undefined),
    z.array(z.string().uuid("Invalid brand id")).optional()
  ),

    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    isActive: z.preprocess(
        (val) => {
            if (val === "true") return true;
            if (val === "false") return false;
            return val;
        },
        z.boolean().optional()
    ),
        
     page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
    price: z.enum(["asc", "desc"]).optional(),
    stock: z.enum(["asc", "desc"]).optional(),
    stockStatus: z.enum(["in_stock", "out_of_stock", "low_stock"]).optional(),
})
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const createProductVariantPayloadSchema = z.object({
    price: z.coerce.number().positive(),
    salePrice: z.coerce.number().positive().optional(),
    stockCount: z.coerce.number().int().nonnegative(),
    
    attributes: variantAttributesSchema.optional(),
    images: z.array(
        z.object({
            url: z.string().url(),
            alt: z.string().optional(),
            position: z.coerce.number().int().nonnegative().optional(),
        })
    ).optional(),

  weight: z.coerce.number().nonnegative().optional(),
dimensions: z.object({
  length: z.coerce.number().nonnegative(),
  width: z.coerce.number().nonnegative(),
  height: z.coerce.number().nonnegative(),
}).optional(),

    isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.salePrice && data.salePrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale price cannot be greater than regular price",
        });
    }
  });

export type CreateProductVariantPayload = z.infer<typeof createProductVariantPayloadSchema>;