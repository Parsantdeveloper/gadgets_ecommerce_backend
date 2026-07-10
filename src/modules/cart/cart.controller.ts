import { Request, Response } from "express";
import { addToCartSchema, updateCartItemSchema } from "./cart.schema.js";
import cartService from "./cart.service.js";
import { ApiResponse } from "@/utils/ApiResponce.js";

// ─── Create / get cart ────────────────────────────────────────────────────────

export const createCartHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const cart = await cartService.createOrGetCart(userId);
        res.status(200).json(ApiResponse.success(cart, {}, "Cart ready"));
    } catch (error) {
        next(error);
    }
};

// ─── Get cart ─────────────────────────────────────────────────────────────────

export const getCartHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const cart = await cartService.getCart(userId);
        res.status(200).json(ApiResponse.success(cart, {}, "Cart retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// ─── Add to cart ──────────────────────────────────────────────────────────────

export const addToCartHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const payload = addToCartSchema.parse(req.body);
        const item = await cartService.addToCart(userId, payload);
        res.status(201).json(ApiResponse.success(item, {}, "Item added to cart"));
    } catch (error) {
        next(error);
    }
};

// ─── Update cart item ─────────────────────────────────────────────────────────

export const updateCartItemHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const { itemId } = req.params as { itemId: string };
        const payload = updateCartItemSchema.parse(req.body);
        const item = await cartService.updateCartItem(userId, itemId, payload);
        res.status(200).json(ApiResponse.success(item, {}, "Cart item updated"));
    } catch (error) {
        next(error);
    }
};

// ─── Remove single item ───────────────────────────────────────────────────────

export const removeCartItemHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const { itemId } = req.params as { itemId: string };
        await cartService.removeCartItem(userId, itemId);
        res.status(200).json(ApiResponse.success(null, {}, "Item removed from cart"));
    } catch (error) {
        next(error);
    }
};

// ─── Clear cart (delete all items, keep cart) ─────────────────────────────────

export const clearCartHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const result = await cartService.clearCart(userId);
        res.status(200).json(ApiResponse.success(result, {}, "Cart cleared"));
    } catch (error) {
        next(error);
    }
};

// ─── Delete cart entirely ─────────────────────────────────────────────────────

export const deleteCartHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const result = await cartService.deleteCart(userId);
        res.status(200).json(ApiResponse.success(result, {}, "Cart deleted"));
    } catch (error) {
        next(error);
    }
};