
import { Request,Response,NextFunction } from "express";
import prisma from "@/config/prisma.js";
import cloudinary from "@/config/cloudinary.js";

export const uploadFile =async (req:Request,res:Response,next:NextFunction)=>{

    try {
        let file = req.file?.path;
        if(!file){
            return res.status(400).json({message:'No file uploaded'});
        }
       let upload = await prisma.upload.create({
            data:{
                url:file,
                public_id:req.file?.filename||'',
            }
        })
        return res.status(200).json({message:'File uploaded successfully',data:{...upload}});
       
    } catch (error) {
        next(error);
    }
}

 export const deletefile = async (req:Request,res:Response,next:NextFunction)=>{
  try {

    const { public_id } = req.body as { public_id: string };
    console.log("Deleting file with public_id:", public_id);
   const image = await cloudinary.uploader.destroy(public_id);
    if(image.result === 'ok'){
      return res.status(200).json({message:'File deleted successfully'});
    }
  } catch (error) {
    next(error);
  }
 }

 export let updateImageName = async (oldfileId:string)=>{
    try {
      const newfileId = oldfileId.replace("temp/", "");
     let data = await cloudinary.uploader.rename(oldfileId, newfileId);
     
     console.log("Image renamed successfully:", data);
     return data;
    } catch (error) {
        console.error("Error updating image name:", error);
    }
}

export const deleteTempImage = async () => {
  try {
    const expiryTime = new Date(Date.now() - 30 * 60 * 1000);

    const tempImages = await prisma.upload.findMany({
      where: {
        public_id: {
          startsWith: "temp/",
        },
        createdAt: {
          lt: expiryTime,
        },
      },
    });

    for (const image of tempImages) {
      await cloudinary.uploader.destroy(image.public_id);

      await prisma.upload.delete({
        where: { id: image.id },
      });
    }
  } catch (error) {
    console.error("Temp image cleanup failed", error);
  }
};
