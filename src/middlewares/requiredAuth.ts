import { auth } from "../utils/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { Request,Response,NextFunction } from "express";
import prisma from "@/config/prisma.js";
export async function requireAuth(req:Request, res:Response, next:NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized"});
  }
 
  req.user = session.user;
  req.session = session;
  console.log("Authenticated user:", session.user);
  next();
}
