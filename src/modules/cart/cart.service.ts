import { NotFoundError } from "@/utils/error.js";
import cartRepository from "./cart.repository.js";
import { AddToCartPayload, UpdateCartItemPayload } from "./cart.schema.js";

export class CartService {
    // ── Create / get cart ────────────────────────────────────────────────────

    async createOrGetCart(userId: string) {
        return cartRepository.upsertCart(userId);
    }

    // ── Get cart ─────────────────────────────────────────────────────────────

    async getCart(userId: string) {
        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart) throw new NotFoundError("Cart not found");
        return cart;
    }

    // ── Add item ─────────────────────────────────────────────────────────────
    // Auto-creates the cart if the user doesn't have one yet.
    // If the variant is already in the cart, increments quantity instead.

    async addToCart(userId: string, data: AddToCartPayload) {
        const cart = await cartRepository.upsertCart(userId);

        const existingItem = await cartRepository.findCartItem(
            cart.id,
            data.productVariantId
        );

        if (existingItem) {
            return cartRepository.incrementCartItemQuantity(
                existingItem.id,
                data.quantity
            );
        }

        return cartRepository.createCartItem(cart.id, data);
    }

    // ── Update item quantity ─────────────────────────────────────────────────

    async updateCartItem(userId: string, itemId: string, data: UpdateCartItemPayload) {
        const item = await cartRepository.findCartItemById(itemId);
        if (!item) throw new NotFoundError("Cart item not found");

        // Ensure the item belongs to this user's cart
        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart || cart.id !== item.cartId) {
            throw new NotFoundError("Cart item not found");
        }

        return cartRepository.updateCartItemQuantity(itemId, data);
    }

    // ── Remove single item ───────────────────────────────────────────────────

    async removeCartItem(userId: string, itemId: string) {
        const item = await cartRepository.findCartItemById(itemId);
        if (!item) throw new NotFoundError("Cart item not found");

        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart || cart.id !== item.cartId) {
            throw new NotFoundError("Cart item not found");
        }

        return cartRepository.deleteCartItem(itemId);
    }

    // ── Clear all items ──────────────────────────────────────────────────────

    async clearCart(userId: string) {
        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart) throw new NotFoundError("Cart not found");

        await cartRepository.clearCart(cart.id);
        return { message: "Cart cleared" };
    }

    // ── Delete cart ──────────────────────────────────────────────────────────

    async deleteCart(userId: string) {
        const cart = await cartRepository.findActiveCartByUserId(userId);
        if (!cart) throw new NotFoundError("Cart not found");

        await cartRepository.deleteCart(cart.id);
        return { message: "Cart deleted" };
    }
}

export default new CartService();