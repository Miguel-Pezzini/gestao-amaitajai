import { ValidationError } from "../../errors/http-errors.js";
import { isObjectId, normalizeText } from "./agenda.utils.js";

export function validateCreateRoom(payload: { name?: unknown }): { name: string } {
  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da sala é obrigatório.");
  }
  return { name };
}

export function validateUpdateRoom(
  roomId: string,
  payload: { name?: unknown },
): { name?: string } {
  if (!isObjectId(roomId)) {
    throw new ValidationError("Identificador de sala inválido.");
  }
  if (payload.name === undefined) {
    return {};
  }

  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da sala é obrigatório.");
  }
  return { name };
}

export function validateRoomId(roomId: string): void {
  if (!isObjectId(roomId)) {
    throw new ValidationError("Identificador de sala inválido.");
  }
}

export function validateIsActive(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError("O campo isActive deve ser booleano.");
  }
  return value;
}
