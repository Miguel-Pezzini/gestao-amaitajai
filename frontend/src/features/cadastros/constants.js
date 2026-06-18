export const MODALITY_OPTIONS = ["INDIVIDUAL", "DUPLA", "GRUPO"];

/** INDIVIDUAL / DUPLA / GRUPO — exibido na UI como "tipo de sessão". */
export const MODALITY_LABELS = {
  INDIVIDUAL: "Individual",
  DUPLA: "Dupla",
  GRUPO: "Grupo",
};

/** Alias de domínio na UI (campo API `modality`). */
export const SESSION_FORMAT_LABELS = MODALITY_LABELS;
export const SESSION_FORMAT_OPTIONS = MODALITY_OPTIONS;

export const USER_ROLE_OPTIONS = ["ADMINISTRADOR", "TECNICO", "RECEPCAO", "OPERADOR"];

export const USER_ROLE_LABELS = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
  RECEPCAO: "Recepção",
  OPERADOR: "Operador",
};

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
