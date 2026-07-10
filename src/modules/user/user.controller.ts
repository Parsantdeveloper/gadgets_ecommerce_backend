import { Request, Response } from "express";
import { createAddressSchema, updateAddressSchema } from "./user.schema.js";
import prisma from "../../config/prisma.js";
import { ApiResponse } from "@/utils/ApiResponce.js";

export const createUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const body = createAddressSchema.parse(req.body);

    const address = await prisma.address.create({
      data: {
        userId,
        ...body,
      },
    });

    return res
      .status(201)
      .json(ApiResponse.success(address,{}, "address created successfully"));
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? JSON.parse(error.message)
          : "Something went wrong",
    });
  }
};

export const getUserAdress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const address = await prisma.address.findMany({
      where: { userId },
    });
    return res
      .status(200)
      .json(
        ApiResponse.success(address, {}, "User Address retrieved successfully"),
      );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? JSON.parse(error.message)
          : "Something went wrong",
    });
  }
};

export const deleteUserAddress = async (req: Request, res: Response) => {
  try {
    const addressId: string = req.params.addressId as string;
    const userId = req.user!.id;
    const address = await prisma.address.delete({
      where: {  id: addressId,userId },
    });
    return res
      .status(200)
      .json(ApiResponse.success(address, {},     "User Address deleted successfully"));
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? JSON.parse(error.message)
          : "Something went wrong",
    });
  }
};

export const updateUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId: string = req.params.addressId as string;
    const body = updateAddressSchema.parse(req.body);
    console.log("ya samma aaxa hai");
    const address = await prisma.address.update({
      where: {
        id: addressId,
        userId,
      },
      data: {
        ...body,
      },
    });
    console.log("logging body + ", body);
    console.log("address    " + address);
    return res
      .status(200)
      .json(ApiResponse.success(address, {}, "User Adress updated successfully"));
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? JSON.parse(error.message)
          : "Something went wrong",
    });
  }
};
