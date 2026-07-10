import { Request,Response,NextFunction } from "express";
import prisma from "@/config/prisma.js";
export async function requireAdmin(req:Request, res:Response, next:NextFunction) {

   let role = await prisma.user.findUnique({
    where:{
      id:req.user.id
     },
     select:{
      role:true
    }
  })
  if (role.role!== "ADMIN") {
    return res.status(403).json({ message: "Admin only" });
  }
  
  next();
}
