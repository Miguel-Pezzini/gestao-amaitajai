import type { Types } from "mongoose";
import type { SessionModality } from "../models/session-type.model.js";

export type SessionOverlapFilter = {
  status: { $ne: "cancelada" };
  startAt: { $lt: Date };
  endAt: { $gt: Date };
  _id?: { $ne: string };
};

export function buildSessionOverlapFilter(params: {
  startAt: Date;
  endAt: Date;
  excludeSessionId?: string;
}): SessionOverlapFilter {
  const filter: SessionOverlapFilter = {
    status: { $ne: "cancelada" },
    startAt: { $lt: params.endAt },
    endAt: { $gt: params.startAt },
  };
  if (params.excludeSessionId) {
    filter._id = { $ne: params.excludeSessionId };
  }
  return filter;
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
  _id: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  modality: SessionModality | string;
  sessionTypeId?: Types.ObjectId | { name?: string } | null;
  roomId?: Types.ObjectId | { name?: string } | null;
  professionalIds: Types.ObjectId[];
  patientIds: Types.ObjectId[];
};

function readPopulatedName(
  value: Types.ObjectId | { name?: string } | null | undefined,
): string {
  if (!value || typeof value !== "object" || !("name" in value)) {
    return "";
  }
  return value.name?.trim() ?? "";
}

export function formatConflictSession(session: PopulatedConflictSession): ConflictSessionSummary {
  return {
    _id: session._id.toString(),
    startAt: session.startAt.toISOString(),
    endAt: session.endAt.toISOString(),
    modality: session.modality,
    sessionTypeName: readPopulatedName(session.sessionTypeId),
    roomName: readPopulatedName(session.roomId),
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
      const key = participantId.toString();
      if (!conflicts.has(key)) {
        conflicts.set(key, summary);
      }
    }
  }

  return conflicts;
}
