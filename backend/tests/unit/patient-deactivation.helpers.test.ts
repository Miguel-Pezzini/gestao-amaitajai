import { describe, expect, it } from "vitest";
import {
  buildReplacementKey,
  requiresPatientReplacementOnDeactivation,
  shouldCancelSessionOnPatientDeactivation,
} from "../../src/services/patient-deactivation.helpers.js";

describe("patient-deactivation.helpers", () => {
  it("cancela sessão individual", () => {
    expect(shouldCancelSessionOnPatientDeactivation("individual", 1)).toBe(true);
    expect(requiresPatientReplacementOnDeactivation("individual", 1)).toBe(false);
  });

  it("exige substituição em dupla", () => {
    expect(shouldCancelSessionOnPatientDeactivation("dupla", 2)).toBe(false);
    expect(requiresPatientReplacementOnDeactivation("dupla", 2)).toBe(true);
  });

  it("exige substituição em grupo com outros participantes", () => {
    expect(shouldCancelSessionOnPatientDeactivation("grupo", 3)).toBe(false);
    expect(requiresPatientReplacementOnDeactivation("grupo", 3)).toBe(true);
    expect(shouldCancelSessionOnPatientDeactivation("grupo", 2)).toBe(false);
    expect(requiresPatientReplacementOnDeactivation("grupo", 2)).toBe(true);
  });

  it("cancela sessão em grupo quando o paciente é o único", () => {
    expect(shouldCancelSessionOnPatientDeactivation("grupo", 1)).toBe(true);
    expect(requiresPatientReplacementOnDeactivation("grupo", 1)).toBe(false);
  });

  it("monta chave de substituição por série ou sessão", () => {
    expect(buildReplacementKey({ seriesId: "11111111-1111-4111-8111-111111111111" })).toBe(
      "series:11111111-1111-4111-8111-111111111111",
    );
    expect(buildReplacementKey({ sessionId: "22222222-2222-4222-8222-222222222222" })).toBe(
      "session:22222222-2222-4222-8222-222222222222",
    );
  });
});
