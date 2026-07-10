
import { NextFunction, Request,Response } from "express";
import { BulkCreateBrandSchema,getBrandsSchema } from "./brand.schema.js";
import slug from "slug";
import prisma from "@/config/prisma.js";
import { Prisma } from "@/generated/prisma/browser.js";
import { NotFoundError } from "@/utils/error.js";
import { ApiResponse } from "@/utils/ApiResponce.js";
//  bulk create brands . 

export const bulkCreateBrands = async(req:Request,res:Response , next:NextFunction)=>{
     try {
    const brands = BulkCreateBrandSchema.parse(req.body);
     const brandsToCreate = brands.map((brand)=>{
        return {
            slug:slug(brand.name,{lower:true}),
            ...brand
        }
     })
     const chunksize = 200; // Adjust the chunk size as needed
      for (let i = 0; i < brandsToCreate.length; i += chunksize) {
        const chunk = brandsToCreate.slice(i, i + chunksize);
         await prisma.brand.createMany({
            data:chunk,
            skipDuplicates:true
         })
      }

     return res.status(201).json(ApiResponse.success(201,{},"Bulk Brands created successfully"))
     } catch (error) {
        next(error)
     }
}

export const getBrands = async(req:Request,res:Response , next:NextFunction)=>{
    try {
     let input = getBrandsSchema.parse(req.query);
        const { search, page, limit, sortBy, sortOrder } = input;
        
        const where:Prisma.BrandWhereInput = {
           isActive:true,
           ...(search && {
            name:{
                contains:search,
                mode:"insensitive"
            }
           })
        }

        const brands = await prisma.brand.findMany({
            where,
            skip:(page-1)*limit,
            take:limit,
            orderBy:{
                [sortBy]:sortOrder
            }
        })
        if(brands.length === 0){
          throw new NotFoundError("No brands found")
        }
         const meta = { 
           page,
           limit,
           total: await prisma.brand.count({where})
         }
        return res.status(200).json(ApiResponse.success(brands, meta,"Brands fetched successfully"))
    } catch (error) {
        next(error)
    }
}