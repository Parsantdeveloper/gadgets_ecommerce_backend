
import express from 'express'
import { createBanner, deleteBanner, getBanners, updateBanner } from './banner.controller.js';
import { requireAuth } from '@/middlewares/requiredAuth.js';
import { requireAdmin } from '@/middlewares/adminGuard.js';
const router = express.Router();

// get banners for users . 

router.get('/', getBanners);


// create banners for admin 

router.post('/', requireAuth, requireAdmin, createBanner);

// delete banner for admin

router.delete('/:id', requireAuth, requireAdmin, deleteBanner);

// update banner for admin

router.put('/:id', requireAuth, requireAdmin, updateBanner);

export default router;