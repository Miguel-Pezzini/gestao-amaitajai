export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isAllowedEmailDomain(email: string, allowedDomain: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  const normalizedDomain = allowedDomain.trim().toLowerCase().replace(/^@/, "");
  if (!normalizedEmail || !normalizedDomain) {
    return false;
  }
  return normalizedEmail.endsWith(`@${normalizedDomain}`);
}

export function assertAllowedEmailDomain(email: string, allowedDomain: string): void {
  if (!isAllowedEmailDomain(email, allowedDomain)) {
    throw new Error("dominio_nao_permitido");
  }
}

export function formatGoogleDisplayName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  if (!first) {
    return "Funcionario";
  }
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}
