

import {user} from "../config/prisma";
import {session} from "../config/prisma";

interface user {
  role : "USER" | "ADMIN"
}
declare global {
  namespace Express {
    interface Request {
      user?: user 
      session?:session;
    }
  }
}
