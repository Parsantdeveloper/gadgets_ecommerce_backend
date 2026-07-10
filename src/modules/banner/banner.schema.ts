
import {z} from 'zod';

export const createBannerSchema = z.object({
    imageUrl : z.string().url(),
    imageId: z.string(),
    linkUrl: z.string().url().optional(),
    validFrom: z.coerce.date().optional(),
validUntil: z.coerce.date().optional(),
    order: z.number().min(0).optional(),
    isActive: z.boolean().default(true),
});


export const updateBannerSchema=createBannerSchema.partial();