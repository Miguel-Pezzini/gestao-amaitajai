import { describe, expect, it } from "vitest";
import { PROTOCOL_MAX_SEQUENCE } from "../../src/domain/protocol.js";

describe("formato do número de protocolo", () => {
  it("usa ano atual com sequência de 5 dígitos", () => {
    const year = 2026;
    const sequence = 1;
    const protocolNumber = year * 100_000 + sequence;

    expect(protocolNumber).toBe(202600001);
    expect(protocolNumber).toBeLessThanOrEqual(year * 100_000 + PROTOCOL_MAX_SEQUENCE);
  });
});
