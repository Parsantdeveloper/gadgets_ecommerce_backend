import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth.js";
import userRoutes from "./modules/user/user.route.js";
import bannerRoutes from "./modules/banner/banner.route.js";
import uploadRoutes from "./modules/uploads/upload.route.js";
import categoryRoutes from "./modules/category/category.route.js";
import brandRouter from "./modules/brand/brand.route.js";
import productRouter from "./modules/product/product.route.js";
import cartRouter from "./modules/cart/cart.route.js";
import orderRouter from "./modules/order/order.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import dotenv from "dotenv"
import cron from "node-cron";
import { deleteTempImage } from "./modules/uploads/uploads.controller.js";
import limiter from "./middlewares/rateLimiter.js";
dotenv.config();
export const app = express();

app.use(limiter);
app.use(
  cors({
    origin: [process.env.FRONTEND_URL,"https://www.glorious.com.np","https://glorious.com.np", "https://dashboard.glorious.com.np"], // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"], // Specify allowed HTTP methods
    credentials: true, 
  })
);

cron.schedule("*/15 * * * *", async () => {
  await deleteTempImage();
});

app.use(helmet());
app.use(morgan("dev")); 
app.all(/^\/api\/auth\/.*$/, toNodeHandler(auth));

app.use(express.json());


app.use("/api/user", userRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use(errorHandler);