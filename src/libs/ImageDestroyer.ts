
import cloudinary from "@/config/cloudinary.js";

export const destroyImage = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
            console.error(`Failed to destroy image with publicId ${publicId}:`, result);
            throw new Error('Failed to destroy image');
        }
    } catch (error) {
        console.error(`Error destroying image with publicId ${publicId}:`, error);
        throw error;
    }
}