import pino from "pino";
import type { Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Rename 'msg' → 'message' for better compatibility with log aggregators
  messageKey: "message",

  // Add base fields to every single log line
  base: {
    service: process.env.SERVICE_NAME || "backend",
    env: process.env.NODE_ENV || "development",
  },

  // Custom timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serializers clean up/redact sensitive data before logging
  serializers: {
    err: pino.stdSerializers.err, // properly serialize Error objects
    req: pino.stdSerializers.req, // standard req serializer
    res: pino.stdSerializers.res, // standard res serializer
  },

  // In production, redact sensitive fields so they never appear in logs
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "req.body.creditCard",
    ],
    censor: "[REDACTED]",
  },

  // Only use pino-pretty in development (it's slow — never use in prod)
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l", // human-readable time
          ignore: "pid,hostname,service,env", // less noise in dev
          messageKey: "message",
        },
      }
    : undefined,
});

export type { Logger };