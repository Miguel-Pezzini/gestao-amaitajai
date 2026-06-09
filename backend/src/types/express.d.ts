import type { UserAccountStatus, UserRole } from "../domain/agenda.js";

export interface AuthUser {
  _id: string;
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
