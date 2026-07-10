
 import express from 'express';

import { bulkCreateBrands, getBrands } from './brand.controller.js';
import { requireAuth } from '@/middlewares/requiredAuth.js';
import { requireAdmin } from '@/middlewares/adminGuard.js';
const router = express.Router();

  // bulk create brands for admin only . . 

router.post("/bulk-create", requireAuth, requireAdmin, bulkCreateBrands);

// get brands  ( filters must be search by name ,pagination and sorting by name and createdAt )

router.get("/", getBrands);

export default router ;