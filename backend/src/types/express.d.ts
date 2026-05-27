import type { Types } from "mongoose";

export interface AuthUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
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
