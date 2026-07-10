import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "temp/misc";

    if (req.baseUrl.includes("products")) folder = "temp/products";
    if (req.baseUrl.includes("banners")) folder = "temp/banners";
    if (req.baseUrl.includes("categories")) folder = "temp/categories";

    return {
      folder,
      resource_type: "image",
      format: "webp", // auto-optimized
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
      transformation: [
        { quality: "auto", fetch_format: "auto" },
      ],
    };
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
