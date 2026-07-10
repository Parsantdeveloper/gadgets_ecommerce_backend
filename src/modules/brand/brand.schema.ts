
import z from "zod";

export const createBrandSchema=z.object({
    name:z.string().min(1).max(100),
    description:z.string().max(500).optional(),
    isActive:z.boolean().default(true),
})

export type BrandType = z.infer<typeof createBrandSchema>

export const BulkCreateBrandSchema = z.array(createBrandSchema).min(1).max(1000);

export const getBrandsSchema = z.object({
    search:z.string().optional(),
    page:z.number().default(1),
    limit:z.number().default(10),
    sortBy:z.enum(["name","createdAt"]).default("createdAt"),
    sortOrder:z.enum(["asc","desc"]).default("desc")
})

export type GetBrandsInput = z.infer<typeof getBrandsSchema>