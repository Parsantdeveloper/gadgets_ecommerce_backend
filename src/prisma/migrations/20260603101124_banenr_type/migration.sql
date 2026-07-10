-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HOME', 'CATEGORY', 'PRODUCT');

-- DropIndex
DROP INDEX "Cart_userId_idx";

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "type" "BannerType" NOT NULL DEFAULT 'HOME';

-- CreateIndex
CREATE INDEX "Cart_userId_status_idx" ON "Cart"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
