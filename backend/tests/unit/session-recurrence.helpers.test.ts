import { describe, expect, it } from "vitest";
import {
  defaultSeriesEndsAt,
  generateRecurrenceDates,
  getTimeMinutesFromDate,
} from "../../src/services/session-recurrence.helpers.js";

describe("session-recurrence.helpers", () => {
  it("gera ocorrências semanais até a data final", () => {
    const startAt = new Date("2026-06-01T13:00:00.000Z");
    const endsAt = new Date("2026-06-30T00:00:00.000Z");

    const dates = generateRecurrenceDates({
      startAt,
      weekdays: [1, 3],
      endsAt,
    });

    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) {
      expect([1, 3]).toContain(date.getDay());
      expect(date.getHours()).toBe(startAt.getHours());
      expect(date.getMinutes()).toBe(startAt.getMinutes());
    }
  });

  it("não gera ocorrências antes do início informado", () => {
    const startAt = new Date("2026-06-04T13:00:00.000Z");
    const endsAt = new Date("2026-06-30T00:00:00.000Z");

    const dates = generateRecurrenceDates({
      startAt,
      weekdays: [1, 3],
      endsAt,
    });

    expect(dates.every((date) => date >= startAt)).toBe(true);
  });

  it("calcula fim padrão no último dia do ano", () => {
    const startAt = new Date("2026-03-15T10:00:00.000Z");
    const endsAt = defaultSeriesEndsAt(startAt);

    expect(endsAt.getFullYear()).toBe(2026);
    expect(endsAt.getMonth()).toBe(11);
    expect(endsAt.getDate()).toBe(31);
  });

  it("calcula minutos do horário", () => {
    const date = new Date("2026-06-01T13:30:00.000Z");
    expect(getTimeMinutesFromDate(date)).toBe(date.getHours() * 60 + date.getMinutes());
  });
});
