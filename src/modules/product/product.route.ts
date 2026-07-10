import express from "express"
 import { createProductHandler, createProductVariant, getMetaForFilters, getProductById, getProducts, getProductsForLandingPage, searchProducts, softDeleteProduct, softDeleteProductVariant, updateProduct, updateProductVariant, } from "./product.controller.js";
const router = express.Router();
import { requireAuth } from "@/middlewares/requiredAuth.js";
import { requireAdmin } from "@/middlewares/adminGuard.js";
// create a new product 
  router.post("/", createProductHandler);

  // create product variant 

  // get products with filters and pagination
router.get("/", getProducts);

  router.post("/:id/variants", createProductVariant);

  // search products by search term . 
  router.get("/search", searchProducts);

  // landing page product sections
  router.get("/landing", getProductsForLandingPage);

 // get meta for filters 
 router.get("/filters/meta", getMetaForFilters);

// get products 
  router.get("/:slug", getProductById);

//update product variant 

router.put("/:slug/variant/:variantId",requireAuth, requireAdmin, updateProductVariant);
 
// update product 
  router.put("/:id", requireAuth, requireAdmin, updateProduct);


// router.put("/:id/specifications/:specId", updateProduct);



// delete product (soft delete)
  // router.delete("/:id", createProductHandler);

 // soft delete product 

 router.delete("/:id",requireAuth, requireAdmin, softDeleteProduct);

 // soft delete product variant
 
 router.delete("/variant/:variantId", requireAuth, requireAdmin, softDeleteProductVariant);

export default router ;