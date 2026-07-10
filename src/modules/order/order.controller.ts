import { Request, Response } from "express";
import {
    processOrderSchema,
    getOrdersQuerySchema,
    getUserOrdersQuerySchema,
} from "./order.schema.js";
import orderService from "./order.service.js";
import { ApiResponse } from "@/utils/ApiResponce.js";
import { OrderStatus } from "@/generated/prisma/client.js";
import { z } from "zod";

// ─── Customer: Process order (checkout) ──────────────────────────────────────

export const processOrderHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const payload = processOrderSchema.parse(req.body);
        const order = await orderService.processOrder(userId, payload);
        res.status(201).json(ApiResponse.success(order, {}, "Order placed successfully"));
    } catch (error) {
        next(error);
    }
};

// ─── Customer: Cancel order ───────────────────────────────────────────────────

export const cancelOrderHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const { orderId } = req.params as {orderId: string};
        const order = await orderService.cancelOrder(userId, orderId);
        res.status(200).json(ApiResponse.success(order, {}, "Order cancelled successfully"));
    } catch (error) {
        next(error);
    }
};

// ─── Customer: Get own orders ─────────────────────────────────────────────────

export const getUserOrdersHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const query = getUserOrdersQuerySchema.parse(req.query);
        const result = await orderService.getUserOrders(userId, query);
        res.status(200).json(
            ApiResponse.success(result.orders, { total: result.total, page: result.page, limit: result.limit }, "Orders retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

// ─── Customer: Get single order detail ───────────────────────────────────────

export const getOrderByIdHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const userId = req.user!.id;
        const { orderId } = req.params as {orderId: string};
        const order = await orderService.getOrderById(userId, orderId);
        res.status(200).json(ApiResponse.success(order, {}, "Order retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get all orders ────────────────────────────────────────────────────

export const getOrdersHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const query = getOrdersQuerySchema.parse(req.query);
        const result = await orderService.getOrders(query);
        res.status(200).json(
            ApiResponse.success(result.orders, { total: result.total, page: result.page, limit: result.limit }, "Orders retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Update order status ───────────────────────────────────────────────

export const updateOrderStatusHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const { orderId } = req.params as {orderId: string};
        const { status } = z.object({
            status: z.nativeEnum(OrderStatus),
        }).parse(req.body);
        const order = await orderService.updateOrderStatus(orderId, status);
        res.status(200).json(ApiResponse.success(order, {}, "Order status updated"));
    } catch (error) {
        next(error);
    }
};