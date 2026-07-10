
import express from "express";
import { uploadFile,updateImageName, deletefile } from "./uploads.controller.js";
import {upload} from "../../middlewares/upload.js";
const router = express.Router();


// upload file 
router.post("/", upload.single('image'), uploadFile);

// delete file 
router.delete("/", deletefile );


// update image name 

router.put("/update", updateImageName);


export default router;