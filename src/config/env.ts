import { z } from "zod";
import dotenv from "dotenv"
dotenv.config()

const envSchema = z.object({
NODE_ENV: z.enum(["development", "production", "test"]),
PORT: z.string(),
DATABASE_URL: z.string().url(),
REDIS_URL: z.string().url(),
REDIS_PASSWORD: z.string(),
});


const parsed = envSchema.safeParse(process.env);


if (!parsed.success) {
console.error(parsed.error.format());
process.exit(1);
}


export const env = parsed.data;