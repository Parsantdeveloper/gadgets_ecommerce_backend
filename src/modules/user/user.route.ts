import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../utils/auth.js"; // Your Better Auth instance
import express,{Request , Response } from "express"
import {createUserAddress,deleteUserAddress,getUserAdress, updateUserAddress} from "./user.controller.js"
import { requireAuth } from "@/middlewares/requiredAuth.js";

const router=express.Router();

router.get("/me",async(req:Request,res:Response)=>{
    const session = await auth.api.getSession({
        headers:fromNodeHeaders(req.headers)
    })
    console.log(req.headers)
    return res.json(session)
})


// create user address

router.post("/address",requireAuth,createUserAddress);

// get user address 

router.get("/address/me",requireAuth,getUserAdress);

// delete user adddress 

router.delete("/address/:addressId",requireAuth,deleteUserAddress);

//update user address

router.put("/address/:addressId",requireAuth,updateUserAddress)
export default router;