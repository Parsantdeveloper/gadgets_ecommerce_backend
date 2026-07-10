import { z } from "zod";

const baseAddressSchema = {
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^(?:\+977)?9[6-9]\d{8}$/),
  district: z.string().min(2).max(50),
  city: z.string().min(2).max(50),
  tole: z.string().min(2).max(100),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  addressLine: z.string().max(200).optional(),
};

export const createAddressSchema = z.object(baseAddressSchema);

export const updateAddressSchema = z.object(baseAddressSchema).partial();
