
import express from "express";
import { createBulkCategories, createCategory, deleteCategory, getCategories, getCategoryForLandingPage, getCategoryParentChild, updateCategory } from "./category.controller.js";
import { requireAuth } from "@/middlewares/requiredAuth.js";
import { requireAdmin } from "@/middlewares/adminGuard.js";
const router = express.Router();

// get categories 
  router.get("/", getCategories);
  router.get("/parent-child", getCategoryParentChild);
 
// create categories 

  router.post("/", requireAuth, requireAdmin, createCategory);


// update categories 
  router.put("/:id", requireAuth, requireAdmin, updateCategory)

// delete categories (soft_delete)

  router.delete("/:id",requireAuth, requireAdmin, deleteCategory)

  // get categories for landing page
  router.get("/landing", getCategoryForLandingPage)
 
  router.post("/bulk-create",requireAuth, requireAdmin, createBulkCategories)

export default router ;