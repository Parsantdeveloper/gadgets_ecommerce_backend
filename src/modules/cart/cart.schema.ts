import { z } from "zod";

// ─── Add Item ─────────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
    productVariantId: z.string().uuid("Invalid productVariantId"),
    quantity: z.coerce.number().int().positive().default(1),
});

// ─── Update Item ──────────────────────────────────────────────────────────────

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type AddToCartPayload = z.infer<typeof addToCartSchema>;
export type UpdateCartItemPayload = z.infer<typeof updateCartItemSchema>;