import { z } from "zod";
import { OrderStatus, PaymentMethod } from "@/generated/prisma/client.js";

// ─── Process Order (checkout) ─────────────────────────────────────────────────

export const processOrderSchema = z.object({
    addressId: z.string().uuid("Invalid addressId"),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
});

// ─── Cancel Order ─────────────────────────────────────────────────────────────



// ─── Admin: Get Orders (filters + pagination) ─────────────────────────────────

export const getOrdersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.nativeEnum(OrderStatus).optional(),
    search: z.string().optional(),           // order id or user email/name
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

// ─── User: Get Own Orders (pagination only) ───────────────────────────────────

export const getUserOrdersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.nativeEnum(OrderStatus).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ProcessOrderPayload = z.infer<typeof processOrderSchema>;
export type GetOrdersQuery      = z.infer<typeof getOrdersQuerySchema>;
export type GetUserOrdersQuery  = z.infer<typeof getUserOrdersQuerySchema>;