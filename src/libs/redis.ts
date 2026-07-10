import {Redis} from "ioredis";
import { env } from "../config/env.js";
const redisUrl = env.REDIS_URL || `redis://:${env.REDIS_PASSWORD}@redis:6379`;


const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;