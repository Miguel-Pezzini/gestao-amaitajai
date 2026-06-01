import type { SessionModality } from "../domain/agenda.js";

export type SessionOverlapWhere = {
  status: { not: "cancelada" };
  startAt: { lt: Date };
  endAt: { gt: Date };
  id?: { not: string };
};

export function buildSessionOverlapWhere(params: {
  startAt: Date;
  endAt: Date;
  excludeSessionId?: string;
}): SessionOverlapWhere {
  const where: SessionOverlapWhere = {
    status: { not: "cancelada" },
    startAt: { lt: params.endAt },
    endAt: { gt: params.startAt },
  };
  if (params.excludeSessionId) {
    where.id = { not: params.excludeSessionId };
  }
  return where;
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
  professionalIds: string[];
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

export function indexConflictsByParticipantId(
  sessions: PopulatedConflictSession[],
  participantField: "professionalIds" | "patientIds",
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

export function mapOverlapSessionToConflictShape(session: {
  id: string;
  startAt: Date;
  endAt: Date;
  modality: string;
  sessionType: { name: string } | null;
  room: { name: string } | null;
  professionals: Array<{ professionalId: string }>;
  patients: Array<{ patientId: string }>;
}): PopulatedConflictSession {
  return {
    id: session.id,
    startAt: session.startAt,
    endAt: session.endAt,
    modality: session.modality,
    sessionType: session.sessionType,
    room: session.room,
    professionalIds: session.professionals.map((row) => row.professionalId),
    patientIds: session.patients.map((row) => row.patientId),
  };
}
