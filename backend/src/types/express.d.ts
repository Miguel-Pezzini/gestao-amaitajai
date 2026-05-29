import type { Types } from "mongoose";
import type { UserAccountStatus, UserRole } from "../models/user.model.js";

export interface AuthUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: UserAccountStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
