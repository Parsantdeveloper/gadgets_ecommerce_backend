import { BadRequestError, NotFoundError } from "@/utils/error.js";
import { ProcessOrderPayload, GetOrdersQuery, GetUserOrdersQuery } from "./order.schema.js";
import orderRepository from "./order.repository.js";
import cartRepository from "../cart/cart.repository.js";
import prisma from "../../config/prisma.js";
import { Prisma } from "@/generated/prisma/client.js";
import { sendOrderProcessingEmail } from "./order.email.js";

// Statuses from which cancellation is allowed
const CANCELLABLE_STATUSES = ["PENDING", "PROCESSING"] as const;

export class OrderService {

    // ── Process order (checkout) ─────────────────────────────────────────────

    async processOrder(userId: string, data: ProcessOrderPayload) {
        // 1. Get active cart with items
        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart) throw new NotFoundError("Cart not found");
        if (cart.CartItem.length === 0) throw new BadRequestError("Cart is empty");

        // 2. Validate address belongs to this user
        const address = await prisma.address.findFirst({
            where: { id: data.addressId, userId },
        });
        if (!address) throw new NotFoundError("Address not found");

        // 3. Build order items and calculate total inside a transaction
        const order = await prisma.$transaction(async (tx) => {

            // Fetch current variant prices (source of truth for snapshot)
            const variantIds = cart.CartItem.map((item) => item.productVariant.id);
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, price: true, salePrice: true },
            });

            const variantPriceMap = new Map(
                variants.map((v) => [v.id, v.salePrice ?? v.price])
            );

            // Build items with snapshotted prices
            const items = cart.CartItem.map((item) => {
                const price = variantPriceMap.get(item.productVariant.id);
                if (!price) throw new BadRequestError(`Variant ${item.productVariant.id} no longer available`);

                return {
                    productVariantId: item.productVariant.id,
                    quantity: item.quantity,
                    price: new Prisma.Decimal(price.toString()),
                };
            });

            // Calculate total
            const totalAmount = items.reduce(
                (sum, item) => sum.add(item.price.mul(item.quantity)),
                new Prisma.Decimal(0)
            );

            // Create order + order items
            const newOrder = await orderRepository.createOrder(tx, {
                userId,
                addressId: data.addressId,
                paymentMethod: data.paymentMethod,
                totalAmount,
                items,
            });

            // Mark cart as checked out
            await tx.cart.update({
                where: { id: cart.id },
                data: { status: "CHECKED_OUT" },
            });

            return newOrder;
        });

        if (order.user?.email) {
            await sendOrderProcessingEmail({
                to: order.user.email,
                orderId: order.id,
                customerName: order.user.name,
                totalAmount: order.totalAmount.toString(),
                paymentMethod: order.paymentMethod,
            });
        }

        return order;
    }

    // ── Cancel order ─────────────────────────────────────────────────────────

    async cancelOrder(userId: string, orderId: string, ) {
        const order = await orderRepository.findByIdAndUser(orderId, userId);
        if (!order) throw new NotFoundError("Order not found");

        if (!CANCELLABLE_STATUSES.includes(order.status as any)) {
            throw new BadRequestError(
                `Order cannot be cancelled. Current status: ${order.status}`
            );
        }

        return orderRepository.updateStatus(orderId, "CANCELLED");
    }

    // ── Get user's own orders ────────────────────────────────────────────────

    async getUserOrders(userId: string, query: GetUserOrdersQuery) {
        return orderRepository.getUserOrders(userId, query);
    }

    // ── Get single order (user scoped) ───────────────────────────────────────

    async getOrderById(userId: string, orderId: string) {
        const order = await orderRepository.findByIdAndUser(orderId, userId);
        if (!order) throw new NotFoundError("Order not found");
        return order;
    }

    // ── Admin: get all orders ────────────────────────────────────────────────

    async getOrders(query: GetOrdersQuery) {
        return orderRepository.getOrders(query);
    }

    // ── Admin: update order status ───────────────────────────────────────────

    async updateOrderStatus(orderId: string, status: string) {
        const order = await orderRepository.findById(orderId);
        if (!order) throw new NotFoundError("Order not found");

        if (order.status === "CANCELLED") {
            throw new BadRequestError("Cannot update a cancelled order");
        }

        return orderRepository.updateStatus(orderId, status);
    }
}

export default new OrderService();