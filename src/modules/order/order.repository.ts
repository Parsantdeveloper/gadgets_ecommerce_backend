import prisma from "../../config/prisma.js";
import { Prisma } from "@/generated/prisma/client.js";
import { GetOrdersQuery, GetUserOrdersQuery } from "./order.schema.js";

// ─── Shared selects ───────────────────────────────────────────────────────────

const orderItemSelect = {
    id: true,
    quantity: true,
    price: true,
    productVariant: {
        select: {
            id: true,
            sku: true,
            price: true,
            salePrice: true,
            images: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    },
} as const;

const orderSelect = {
    id: true,
    status: true,
    paymentStatus: true,
    paymentMethod: true,
    totalAmount: true,
    createdAt: true,
    updatedAt: true,
    address: {
        select: {
            id: true,
            fullName: true,
            phone: true,
            district: true,
            city: true,
            tole: true,
            postalCode: true,
            addressLine: true,
        },
    },
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    orderItems: {
        select: orderItemSelect,
    },
} as const;

// summary shape for list views (no items)
const orderSummarySelect = {
    id: true,
    status: true,
    paymentStatus: true,
    paymentMethod: true,
    totalAmount: true,
    createdAt: true,
    address: {
        select: {
            fullName: true,
            city: true,
            district: true,
        },
    },
} as const;

interface OrderData{
     userId: string;
            addressId: string;
            paymentMethod: string;
            totalAmount: Prisma.Decimal;
            items: {
                productVariantId: string;
                quantity: number;
                price: Prisma.Decimal;
            }[];
}

// ─── Repository ───────────────────────────────────────────────────────────────

class OrderRepository {

    // ── Create order inside a transaction ────────────────────────────────────

    async createOrder(
        tx: Prisma.TransactionClient,
        data: OrderData
    ) 
     {
        return tx.order.create({
            data: {
                userId: data.userId,
                addressId: data.addressId,
                paymentMethod: data.paymentMethod as any,
                totalAmount: data.totalAmount,
                orderItems: {
                    create: data.items.map((item) => ({
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            select: orderSelect,
        });
    }

    // ── Find order by id ─────────────────────────────────────────────────────

    async findById(orderId: string) {
        return prisma.order.findUnique({
            where: { id: orderId },
            select: orderSelect,
        });
    }

    // ── Find order by id scoped to a user ────────────────────────────────────

    async findByIdAndUser(orderId: string, userId: string) {
        return prisma.order.findFirst({
            where: { id: orderId, userId },
            select: orderSelect,
        });
    }

    // ── Get paginated orders for a user ──────────────────────────────────────

    async getUserOrders(userId: string, query: GetUserOrdersQuery) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            userId,
            ...(status && { status }),
        };

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                select: orderSummarySelect,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return { orders, total, page, limit };
    }

    // ── Admin: get all orders with filters ───────────────────────────────────

    async getOrders(query: GetOrdersQuery) {
        const { page, limit, status, search, dateFrom, dateTo } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            ...(status && { status }),
            ...(dateFrom || dateTo
                ? {
                      createdAt: {
                          ...(dateFrom && { gte: dateFrom }),
                          ...(dateTo && { lte: dateTo }),
                      },
                  }
                : {}),
            ...(search && {
                OR: [
                    { id: { contains: search, mode: "insensitive" } },
                    { user: { email: { contains: search, mode: "insensitive" } } },
                    { user: { name: { contains: search, mode: "insensitive" } } },
                ],
            }),
        };

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                select: orderSelect,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return { orders, total, page, limit };
    }

    // ── Update order status ──────────────────────────────────────────────────

    async updateStatus(orderId: string, status: string) {
        return prisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
            select: orderSelect,
        });
    }
}

export default new OrderRepository();