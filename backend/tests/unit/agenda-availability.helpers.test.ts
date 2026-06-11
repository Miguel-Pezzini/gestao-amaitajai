import { describe, expect, it } from "vitest";
import {
  doTimeWindowsOverlap,
  getProfessionalEffectiveWindow,
  hasProfessionalConflictInSessions,
} from "../../src/services/agenda-availability.helpers.js";

describe("agenda-availability.helpers", () => {
  const sessionBounds = {
    startAt: new Date("2026-06-10T10:00:00.000Z"),
    endAt: new Date("2026-06-10T12:00:00.000Z"),
  };

  it("usa sessão inteira quando profissional não é apoio", () => {
    const window = getProfessionalEffectiveWindow(
      {
        isApoio: false,
        participationStartAt: null,
        participationEndAt: null,
      },
      sessionBounds,
    );

    expect(window.startAt).toEqual(sessionBounds.startAt);
    expect(window.endAt).toEqual(sessionBounds.endAt);
  });

  it("usa janela parcial quando profissional é apoio", () => {
    const window = getProfessionalEffectiveWindow(
      {
        isApoio: true,
        participationStartAt: new Date("2026-06-10T10:15:00.000Z"),
        participationEndAt: new Date("2026-06-10T10:45:00.000Z"),
      },
      sessionBounds,
    );

    expect(window.startAt.toISOString()).toBe("2026-06-10T10:15:00.000Z");
    expect(window.endAt.toISOString()).toBe("2026-06-10T10:45:00.000Z");
  });

  it("detecta sobreposição parcial entre janelas", () => {
    expect(
      doTimeWindowsOverlap(
        {
          startAt: new Date("2026-06-10T10:00:00.000Z"),
          endAt: new Date("2026-06-10T10:30:00.000Z"),
        },
        {
          startAt: new Date("2026-06-10T10:15:00.000Z"),
          endAt: new Date("2026-06-10T11:00:00.000Z"),
        },
      ),
    ).toBe(true);
  });

  it("não detecta conflito em horários encostados", () => {
    expect(
      doTimeWindowsOverlap(
        {
          startAt: new Date("2026-06-10T10:00:00.000Z"),
          endAt: new Date("2026-06-10T10:30:00.000Z"),
        },
        {
          startAt: new Date("2026-06-10T10:30:00.000Z"),
          endAt: new Date("2026-06-10T11:00:00.000Z"),
        },
      ),
    ).toBe(false);
  });

  it("ignora conflito fora da janela de apoio", () => {
    const hasConflict = hasProfessionalConflictInSessions(
      [
        {
          id: "session-1",
          startAt: sessionBounds.startAt,
          endAt: sessionBounds.endAt,
          modality: "GRUPO",
          sessionType: { name: "Grupo" },
          room: { name: "Sala 1" },
          professionals: [
            {
              professionalId: "prof-1",
              isApoio: true,
              participationStartAt: new Date("2026-06-10T10:00:00.000Z"),
              participationEndAt: new Date("2026-06-10T10:30:00.000Z"),
            },
          ],
          patientIds: ["patient-1"],
        },
      ],
      [
        {
          professionalId: "prof-1",
          isApoio: false,
          participationStartAt: null,
          participationEndAt: null,
        },
      ],
      {
        startAt: new Date("2026-06-10T10:30:00.000Z"),
        endAt: new Date("2026-06-10T11:00:00.000Z"),
      },
    );

    expect(hasConflict).toBe(false);
  });
});
