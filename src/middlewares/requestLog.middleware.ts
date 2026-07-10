import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger, Logger } from "../config/logger.js";

declare global {
  namespace Express {
    interface Request {
      log: Logger;   // <-- plain Logger, no generics
      requestId: string;
    }
  }
}

export function requestLoggerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const requestId =
    (req.headers["x-request-id"] as string) ?? randomUUID();

  req.requestId = requestId;
  req.log = logger.child({ requestId, method: req.method, path: req.path });

  req.log.info("incoming request");
  next();
}