import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, message);
    this.name = "ForbiddenError";
  }
}
