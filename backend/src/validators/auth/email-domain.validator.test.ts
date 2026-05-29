import { describe, expect, it } from "vitest";
import {
  formatGoogleDisplayName,
  isAllowedEmailDomain,
} from "./email-domain.validator.js";

describe("email-domain.validator", () => {
  it("aceita e-mails do domínio institucional", () => {
    expect(isAllowedEmailDomain("debora@amaitajai.org.br", "amaitajai.org.br")).toBe(true);
  });

  it("rejeita e-mails de outros domínios", () => {
    expect(isAllowedEmailDomain("user@gmail.com", "amaitajai.org.br")).toBe(false);
  });

  it("formata o primeiro nome com inicial maiúscula", () => {
    expect(formatGoogleDisplayName("debora silva")).toBe("Debora");
    expect(formatGoogleDisplayName("DEBORA SILVA")).toBe("Debora");
  });
});
