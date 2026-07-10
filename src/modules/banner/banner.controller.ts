
import {Request,Response,NextFunction} from 'express'
import prisma from '@/config/prisma.js';
import { ApiResponse } from '@/utils/ApiResponce.js';
import { createBannerSchema ,updateBannerSchema} from './banner.schema.js';
import cloudinary from '@/config/cloudinary.js';
import { updateImageName } from '@/modules/uploads/uploads.controller.js';
export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const banners= await prisma.banner.findMany(({
        where:{isActive:true,
            OR:[
                {
                    validFrom:null,
                    validUntil:null,
                },
                {
                    validFrom:{lte:new Date()},
                    validUntil:{gte:new Date()},
                }
            ]
         } 
       }))
      
        return res.status(200).json( ApiResponse.success(banners,{},'Banners fetched successfully', ));
    } catch (error) {
        next(error);
    }
};

export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let data = createBannerSchema.parse(req.body);
          let imageId: string | undefined
          let imageUrl: string | undefined

        if(data.imageId){
           let image = await updateImageName(data.imageId);

           if(!image){
            return res.status(400).json( ApiResponse.error('Failed to process image'));
           }
           imageId = image.public_id;
           imageUrl = image.secure_url;
        }
        
         if(!imageId || !imageUrl){
            return res.status(400).json( ApiResponse.error('Image is required'));
         }
        const banner = await prisma.banner.create({
            data:{
                ...data,
                imageId,
                imageUrl}
        })
        if(!banner){
            return  res.status(400).json( ApiResponse.error('Failed to create banner'));
        }
        return res.status(201).json( ApiResponse.success(banner,{},'Banner created successfully'));

    } catch (error) {
        next(error);
    }
}

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id:string = req.params.id as string;
        const banner = await prisma.banner.delete({
            where: { id }
        }); 
        if(!banner){
            return res.status(404).json( ApiResponse.error('Banner not found'));
        }
        if(banner.imageId) await cloudinary.uploader.destroy(banner.imageId);

        return res.status(200).json( ApiResponse.success(banner,{},'Banner deleted successfully'));
    } catch (error) {
        next(error);
    }
}

export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let body = updateBannerSchema.parse(req.body);
        const id:string = req.params.id as string;
        const banner = await prisma.banner.update({
            where: { id },
            data: body,
        });
        if(!banner){
            return res.status(404).json( ApiResponse.error('Banner not found'));
        }
        return res.status(200).json( ApiResponse.success(banner,{},'Banner updated successfully'));
    } catch (error) {
        next(error);
    }
}
