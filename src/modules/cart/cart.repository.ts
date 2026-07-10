import prisma from "../../config/prisma.js";
import { AddToCartPayload, UpdateCartItemPayload } from "./cart.schema.js";

// ─── Shared select ────────────────────────────────────────────────────────────

const cartItemSelect = {
    id: true,
    quantity: true,
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

const cartSelect = {
    id: true,
    userId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    CartItem: {
        select: cartItemSelect,
    },
} as const;

// ─── Repository ───────────────────────────────────────────────────────────────

class CartRepository {
    // find a user's active cart
    async findActiveCartByUserId(userId: string) {
        return prisma.cart.findFirst({
            where: { userId, status: "ACTIVE" },
            select: cartSelect,
        });
    }

    // upsert cart — create if not exists, return existing if it does
    async upsertCart(userId: string) {
        const existing = await this.findActiveCartByUserId(userId);
        if (existing) return existing;

        return prisma.cart.create({
            data: { userId },
            select: cartSelect,
        });
    }

    // find a single cart item by id
    async findCartItemById(itemId: string) {
        return prisma.cartItem.findUnique({
            where: { id: itemId },
            select: { id: true, cartId: true, quantity: true, productVariantId: true },
        });
    }

    // find a cart item by cartId + variantId (to detect duplicates)
    async findCartItem(cartId: string, productVariantId: string) {
        return prisma.cartItem.findUnique({
            where: { cartId_productVariantId: { cartId, productVariantId } },
            select: { id: true, quantity: true },
        });
    }

    // add a new item to the cart
    async createCartItem(cartId: string, data: AddToCartPayload) {
        return prisma.cartItem.create({
            data: {
                cartId,
                productVariantId: data.productVariantId,
                quantity: data.quantity,
            },
            select: cartItemSelect,
        });
    }

    // increment quantity on an existing cart item
    async incrementCartItemQuantity(itemId: string, by: number) {
        return prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: { increment: by } },
            select: cartItemSelect,
        });
    }

    // set quantity on a cart item (used by update endpoint)
    async updateCartItemQuantity(itemId: string, data: UpdateCartItemPayload) {
        return prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: data.quantity },
            select: cartItemSelect,
        });
    }

    // delete a single cart item
    async deleteCartItem(itemId: string) {
        return prisma.cartItem.delete({ where: { id: itemId } });
    }

    // delete all items in a cart (clear cart)
    async clearCart(cartId: string) {
        return prisma.cartItem.deleteMany({ where: { cartId } });
    }

    // delete the cart record itself
    async deleteCart(cartId: string) {
        return prisma.cart.delete({ where: { id: cartId } });
    }
}

export default new CartRepository();