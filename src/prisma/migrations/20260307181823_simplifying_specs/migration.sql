/*
  Warnings:

  - You are about to drop the `ProductSpecification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductSpecification" DROP CONSTRAINT "ProductSpecification_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "specifications" JSONB;

-- DropTable
DROP TABLE "ProductSpecification";
