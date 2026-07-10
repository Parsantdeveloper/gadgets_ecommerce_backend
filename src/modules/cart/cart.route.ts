import express from "express";
import { requireAuth } from "@/middlewares/requiredAuth.js";
import {
    createCartHandler,
    getCartHandler,
    addToCartHandler,
    updateCartItemHandler,
    removeCartItemHandler,
    clearCartHandler,
    deleteCartHandler,
} from "./cart.controller.js";

const router = express.Router();

// All cart routes are auth-protected
router.use(requireAuth);

// ─── Cart ─────────────────────────────────────────────────────────────────────
router.post("/", createCartHandler);          // create or get existing cart
router.get("/", getCartHandler);              // get cart with items
router.delete("/", deleteCartHandler);        // delete cart entirely

// ─── Cart Items ───────────────────────────────────────────────────────────────
router.post("/items", addToCartHandler);                    // add item (or increment)
router.patch("/items/:itemId", updateCartItemHandler);      // set quantity
router.delete("/items/:itemId", removeCartItemHandler);     // remove one item
router.delete("/items", clearCartHandler);                  // clear all items

export default router;