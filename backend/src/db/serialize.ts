type WithId = { id: string };

export function withMongoId<T extends WithId>(record: T): Omit<T, "id"> & { _id: string } {
  const { id, ...rest } = record;
  return { ...rest, _id: id };
}

export function withMongoIdList<T extends WithId>(records: T[]): Array<Omit<T, "id"> & { _id: string }> {
  return records.map(withMongoId);
}

type PopulatedNameRef = { id: string; name: string };

export function serializePopulatedNameRef(ref: PopulatedNameRef | null | undefined): { _id: string; name: string } | null {
  if (!ref) {
    return null;
  }
  return { _id: ref.id, name: ref.name };
}

type SessionTypeRef = { id: string; name: string; slug?: string };

export function serializeSessionTypeRef(ref: SessionTypeRef | null | undefined) {
  if (!ref) {
    return null;
  }
  return {
    _id: ref.id,
    name: ref.name,
    ...(ref.slug !== undefined ? { slug: ref.slug } : {}),
  };
}

type PatientFundingSourceRef = { id: string; name: string };

type PatientWithFundingSource = {
  id: string;
  fullName: string;
  birthDate?: Date;
  guardianName?: string;
  phone?: string;
  fundingSourceId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  fundingSource: PatientFundingSourceRef;
};

export function serializePatient(record: PatientWithFundingSource) {
  const { id, fundingSource, fundingSourceId, ...rest } = record;
  return {
    ...rest,
    _id: id,
    fundingSourceId: fundingSourceId ?? fundingSource.id,
    fundingSource: fundingSource.name,
  };
}

export function serializePatientList(records: PatientWithFundingSource[]) {
  return records.map(serializePatient);
}

type PatientRef = { id: string; fullName: string; fundingSource: PatientFundingSourceRef | string };

export function serializePatientRef(ref: PatientRef) {
  const fundingSourceName =
    typeof ref.fundingSource === "string" ? ref.fundingSource : ref.fundingSource.name;
  return {
    _id: ref.id,
    fullName: ref.fullName,
    fundingSource: fundingSourceName,
  };
}

type ProfessionalRef = { id: string; name: string; email: string; role: string };

export function serializeProfessionalRef(ref: ProfessionalRef) {
  return {
    _id: ref.id,
    name: ref.name,
    email: ref.email,
    role: ref.role,
  };
}

export type SessionListInclude = {
  id: string;
  sessionTypeId: string;
  modality: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  status: string;
  notes: string;
  createdById: string;
  updatedById: string;
  cancelledAt: Date | null;
  cancelReason: string;
  seriesId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessionType: { id: string; name: string; slug: string };
  room: { id: string; name: string };
  patients: Array<{ patient: { id: string; fullName: string; fundingSource: PatientFundingSourceRef } }>;
  professionals: Array<{ professional: { id: string; name: string; email: string; role: string } }>;
};

export function serializeSessionForList(session: SessionListInclude) {
  return {
    _id: session.id,
    sessionTypeId: serializeSessionTypeRef(session.sessionType),
    modality: session.modality,
    roomId: serializePopulatedNameRef(session.room),
    startAt: session.startAt,
    endAt: session.endAt,
    durationMinutes: session.durationMinutes,
    status: session.status,
    notes: session.notes,
    createdBy: session.createdById,
    updatedBy: session.updatedById,
    cancelledAt: session.cancelledAt,
    cancelReason: session.cancelReason,
    seriesId: session.seriesId ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    patientIds: session.patients.map((row) => serializePatientRef(row.patient)),
    professionalIds: session.professionals.map((row) => serializeProfessionalRef(row.professional)),
  };
}

export type SessionRecordInclude = SessionListInclude;

export function serializeSessionRecord(session: SessionRecordInclude) {
  return serializeSessionForList(session);
}

export function serializeSessionPlain(session: {
  id: string;
  sessionTypeId: string;
  modality: string;
  roomId: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  status: string;
  notes: string;
  createdById: string;
  updatedById: string;
  cancelledAt: Date | null;
  cancelReason: string;
  seriesId: string | null;
  createdAt: Date;
  updatedAt: Date;
  patientIds?: string[];
  professionalIds?: string[];
  patients?: Array<{ patientId: string }>;
  professionals?: Array<{ professionalId: string }>;
}) {
  const patientIds = session.patientIds ?? session.patients?.map((row) => row.patientId) ?? [];
  const professionalIds =
    session.professionalIds ?? session.professionals?.map((row) => row.professionalId) ?? [];

  return {
    _id: session.id,
    sessionTypeId: session.sessionTypeId,
    modality: session.modality,
    roomId: session.roomId,
    startAt: session.startAt,
    endAt: session.endAt,
    durationMinutes: session.durationMinutes,
    status: session.status,
    notes: session.notes,
    createdBy: session.createdById,
    updatedBy: session.updatedById,
    cancelledAt: session.cancelledAt,
    cancelReason: session.cancelReason,
    seriesId: session.seriesId ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    patientIds,
    professionalIds,
  };
}

export function serializeSessionSeries(series: {
  id: string;
  sessionTypeId: string;
  modality: string;
  roomId: string;
  weekdays: number[];
  startsAt: Date;
  endsAt: Date;
  timeMinutes: number;
  durationMinutes: number;
  status: string;
  notes: string;
  cancelledAt: Date | null;
  cancelReason: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    _id: series.id,
    sessionTypeId: series.sessionTypeId,
    modality: series.modality,
    roomId: series.roomId,
    weekdays: series.weekdays,
    startsAt: series.startsAt,
    endsAt: series.endsAt,
    timeMinutes: series.timeMinutes,
    durationMinutes: series.durationMinutes,
    status: series.status,
    notes: series.notes,
    cancelledAt: series.cancelledAt,
    cancelReason: series.cancelReason,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  };
}
