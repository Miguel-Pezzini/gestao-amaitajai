export const MODALITY_OPTIONS = ["individual", "dupla", "grupo"];

/** individual / dupla / grupo — exibido na UI como "tipo de sessão". */
export const MODALITY_LABELS = {
  individual: "Individual",
  dupla: "Dupla",
  grupo: "Grupo",
};

/** Alias de domínio na UI (campo API `modality`). */
export const SESSION_FORMAT_LABELS = MODALITY_LABELS;
export const SESSION_FORMAT_OPTIONS = MODALITY_OPTIONS;

export const USER_ROLE_OPTIONS = ["administrador", "tecnico"];

export const USER_ROLE_LABELS = {
  administrador: "Administrador",
  tecnico: "Técnico",
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
