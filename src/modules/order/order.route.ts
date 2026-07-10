import express from "express";
import { requireAuth } from "@/middlewares/requiredAuth.js";
import { requireAdmin } from "@/middlewares/adminGuard.js";
import {
    processOrderHandler,
    cancelOrderHandler,
    getUserOrdersHandler,
    getOrderByIdHandler,
    getOrdersHandler,
    updateOrderStatusHandler,
} from "./order.controller.js";

const router = express.Router();

// ─── Customer routes ──────────────────────────────────────────────────────────

router.post("/", requireAuth, processOrderHandler);                          // checkout
router.get("/", requireAuth, getUserOrdersHandler);                          // list own orders
router.get("/:orderId", requireAuth, getOrderByIdHandler);                   // single order detail
router.patch("/:orderId/cancel", requireAuth, cancelOrderHandler);           // cancel order

// ─── Admin routes ─────────────────────────────────────────────────────────────

router.get("/admin/all", requireAuth, requireAdmin, getOrdersHandler);                          // all orders with filters
router.patch("/admin/:orderId/status", requireAuth, requireAdmin, updateOrderStatusHandler);    // update status

export default router;