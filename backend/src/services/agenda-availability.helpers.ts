import type { SessionModality } from "../domain/agenda.js";

export type SessionOverlapWhere = {
  status: { not: "CANCELADA" };
  startAt: { lt: Date };
  endAt: { gt: Date };
  id?: { not: string } | { notIn: string[] };
};

export function buildSessionOverlapWhere(params: {
  startAt: Date;
  endAt: Date;
  excludeSessionId?: string;
  excludeSessionIds?: string[];
}): SessionOverlapWhere {
  const where: SessionOverlapWhere = {
    status: { not: "CANCELADA" },
    startAt: { lt: params.endAt },
    endAt: { gt: params.startAt },
  };
  if (params.excludeSessionIds?.length) {
    where.id = { notIn: params.excludeSessionIds };
  } else if (params.excludeSessionId) {
    where.id = { not: params.excludeSessionId };
  }
  return where;
}

export type ProfessionalAssignment = {
  professionalId: string;
  isApoio: boolean;
  participationStartAt: Date | null;
  participationEndAt: Date | null;
};

export type SessionTimeBounds = {
  startAt: Date;
  endAt: Date;
};

export type EffectiveWindow = {
  startAt: Date;
  endAt: Date;
};

export function getProfessionalEffectiveWindow(
  assignment: Pick<ProfessionalAssignment, "isApoio" | "participationStartAt" | "participationEndAt">,
  session: SessionTimeBounds,
): EffectiveWindow {
  if (
    assignment.isApoio &&
    assignment.participationStartAt &&
    assignment.participationEndAt
  ) {
    return {
      startAt: assignment.participationStartAt,
      endAt: assignment.participationEndAt,
    };
  }

  return {
    startAt: session.startAt,
    endAt: session.endAt,
  };
}

export function doTimeWindowsOverlap(
  windowA: SessionTimeBounds,
  windowB: SessionTimeBounds,
): boolean {
  return windowA.startAt < windowB.endAt && windowA.endAt > windowB.startAt;
}

export type ConflictSessionSummary = {
  _id: string;
  startAt: string;
  endAt: string;
  modality: SessionModality | string;
  sessionTypeName: string;
  roomName: string;
};

export type PopulatedConflictSession = {
  id: string;
  startAt: Date;
  endAt: Date;
  modality: SessionModality | string;
  sessionType: { name: string } | null;
  room: { name: string } | null;
  professionals: ProfessionalAssignment[];
  patientIds: string[];
};

export function formatConflictSession(session: PopulatedConflictSession): ConflictSessionSummary {
  return {
    _id: session.id,
    startAt: session.startAt.toISOString(),
    endAt: session.endAt.toISOString(),
    modality: session.modality,
    sessionTypeName: session.sessionType?.name?.trim() ?? "",
    roomName: session.room?.name?.trim() ?? "",
  };
}

export function indexProfessionalConflictsByEffectiveWindow(
  sessions: PopulatedConflictSession[],
  checkWindow: SessionTimeBounds,
): Map<string, ConflictSessionSummary> {
  const conflicts = new Map<string, ConflictSessionSummary>();

  for (const session of sessions) {
    const summary = formatConflictSession(session);
    const sessionBounds = { startAt: session.startAt, endAt: session.endAt };

    for (const assignment of session.professionals) {
      if (conflicts.has(assignment.professionalId)) {
        continue;
      }

      const effectiveWindow = getProfessionalEffectiveWindow(assignment, sessionBounds);
      if (doTimeWindowsOverlap(effectiveWindow, checkWindow)) {
        conflicts.set(assignment.professionalId, summary);
      }
    }
  }

  return conflicts;
}

export function indexConflictsByParticipantId(
  sessions: PopulatedConflictSession[],
  participantField: "patientIds",
): Map<string, ConflictSessionSummary> {
  const conflicts = new Map<string, ConflictSessionSummary>();

  for (const session of sessions) {
    const summary = formatConflictSession(session);
    for (const participantId of session[participantField]) {
      if (!conflicts.has(participantId)) {
        conflicts.set(participantId, summary);
      }
    }
  }

  return conflicts;
}

export function hasProfessionalConflictInSessions(
  sessions: PopulatedConflictSession[],
  candidateAssignments: ProfessionalAssignment[],
  candidateSessionBounds: SessionTimeBounds,
): boolean {
  for (const candidate of candidateAssignments) {
    const candidateWindow = getProfessionalEffectiveWindow(candidate, candidateSessionBounds);

    for (const session of sessions) {
      const sessionBounds = { startAt: session.startAt, endAt: session.endAt };

      for (const existing of session.professionals) {
        if (existing.professionalId !== candidate.professionalId) {
          continue;
        }

        const existingWindow = getProfessionalEffectiveWindow(existing, sessionBounds);
        if (doTimeWindowsOverlap(candidateWindow, existingWindow)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function mapOverlapSessionToConflictShape(session: {
  id: string;
  startAt: Date;
  endAt: Date;
  modality: string;
  sessionType: { name: string } | null;
  room: { name: string } | null;
  professionals: Array<{
    professionalId: string;
    isApoio?: boolean;
    participationStartAt?: Date | null;
    participationEndAt?: Date | null;
  }>;
  patients: Array<{ patientId: string }>;
}): PopulatedConflictSession {
  return {
    id: session.id,
    startAt: session.startAt,
    endAt: session.endAt,
    modality: session.modality,
    sessionType: session.sessionType,
    room: session.room,
    professionals: session.professionals.map((row) => ({
      professionalId: row.professionalId,
      isApoio: row.isApoio ?? false,
      participationStartAt: row.participationStartAt ?? null,
      participationEndAt: row.participationEndAt ?? null,
    })),
    patientIds: session.patients.map((row) => row.patientId),
  };
}
