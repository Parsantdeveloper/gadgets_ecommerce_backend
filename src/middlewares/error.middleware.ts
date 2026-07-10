import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/AppError.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.flatten(),
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown / programmer errors
  console.error("UNHANDLED ERROR 💥", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
