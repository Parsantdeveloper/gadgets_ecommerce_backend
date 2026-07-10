import { z } from "zod"

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  imageId: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
})
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

export const GetCategoriesSchema = z.object({
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})
export type GetCategoriesInput = z.infer<typeof GetCategoriesSchema>

export const GetCategoryBySlugSchema = z.object({
  slug: z.string().min(1),
})
export type GetCategoryBySlugInput = z.infer<typeof GetCategoryBySlugSchema>

export const UpdateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  imageId: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  metaTitle: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
  metaDescription: z.string().max(160).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated",
})
export type UpdateCategoryInput = {
  id: string
  data: z.infer<typeof UpdateCategorySchema>
}

// ─── Bulk / Nested ───────────────────────────────────────────────────────────

// Recursive Zod type requires an explicit TS interface first
export interface CategoryNode {
  name: string
  children?: CategoryNode[]
}

// z.lazy() enables self-reference
const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    name: z.string().min(2, "Category name too short").max(100, "Category name too long"),
    children: z.array(CategoryNodeSchema).optional(),
  })
)

export const CreateBulkCategoriesSchema = z.object({
  parentId: z.string().uuid(),
  categories: z.array(CategoryNodeSchema).min(1),
})
export type CreateBulkCategoriesInput = z.infer<typeof CreateBulkCategoriesSchema>