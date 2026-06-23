import { SESSION_FORMAT_LABELS } from "@/features/cadastros/constants";
import {
  formatSessionDateTime,
  getSessionFormatLabel,
  getSessionModalityName,
  getSessionPatients,
  getSessionProfessionals,
} from "@/features/agenda/utils";
import { CANCEL_SCOPE_OPTIONS } from "@/features/agenda/utils/recurrence";

function scopeLabel(scope) {
  return CANCEL_SCOPE_OPTIONS.find((item) => item.value === scope)?.label ?? scope;
}

function DiffRow({ label, before, after }) {
  return (
    <div className="grid gap-1.5 rounded-md border border-ama-cyan/15 bg-ama-light/20 px-3 py-2 sm:grid-cols-[7rem_1fr] sm:items-start sm:gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2">
        <span className="rounded-md bg-red-50 px-2 py-1 text-red-800 line-through decoration-red-400/80">
          {before}
        </span>
        <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
          →
        </span>
        <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800">{after}</span>
      </div>
    </div>
  );
}

function ListDiff({ label, removed, added }) {
  if (removed.length === 0 && added.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 rounded-md border border-ama-cyan/15 bg-ama-light/20 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {removed.map((item) => (
          <span
            key={`rm-${item}`}
            className="rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-800 line-through decoration-red-400/80"
          >
            {item}
          </span>
        ))}
        {added.map((item) => (
          <span
            key={`add-${item}`}
            className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function resolveRoomName(roomId, rooms, session) {
  if (!roomId) {
    return getSessionRoomNameFromSession(session);
  }
  if (roomId === session?.roomId?._id) {
    return session.roomId.name;
  }
  return rooms.find((item) => item._id === roomId)?.name ?? "Sala";
}

function getSessionRoomNameFromSession(session) {
  return session?.roomId?.name ?? "Sala";
}

function resolveSessionTypeName(sessionTypeId, sessionTypes, session) {
  if (!sessionTypeId) {
    return getSessionModalityName(session);
  }
  if (sessionTypeId === session?.sessionTypeId?._id) {
    return session.sessionTypeId.name;
  }
  return sessionTypes.find((item) => item._id === sessionTypeId)?.name ?? "Modalidade";
}

function normalizeIdList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map((item) => (typeof item === "string" ? item : item?.professionalId ?? item?._id ?? item?.id)).filter(Boolean);
}

function idListDiff(currentIds, proposedIds, resolveLabel) {
  const proposedSet = new Set(proposedIds);
  const currentSet = new Set(currentIds);
  return {
    removed: currentIds.filter((id) => !proposedSet.has(id)).map(resolveLabel),
    added: proposedIds.filter((id) => !currentSet.has(id)).map(resolveLabel),
  };
}

function emptyDiff() {
  return {
    rows: [],
    patientLabels: { removed: [], added: [] },
    professionalLabels: { removed: [], added: [] },
  };
}

function computeProposedEndAt(proposed, session) {
  const startAt = proposed.startAt ?? session.startAt;
  const durationMinutes = Number(proposed.durationMinutes ?? session.durationMinutes);
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(durationMinutes)) {
    return session.endAt;
  }
  return new Date(start.getTime() + durationMinutes * 60_000).toISOString();
}

function buildEditDiff(request, { rooms, sessionTypes }) {
  const session = request.session;
  const proposed = request.proposedPayload ?? {};
  const labelMaps = request.participantLabels ?? { patients: {}, professionals: {} };

  if (!session) {
    return emptyDiff();
  }

  const resolvePatientLabel = (id) =>
    labelMaps.patients[id] ??
    getSessionPatients(session).find((item) => item.id === id)?.label ??
    "Usuário";

  const resolveProfessionalLabel = (id) =>
    labelMaps.professionals[id] ??
    getSessionProfessionals(session).find((item) => item.id === id)?.label ??
    "Profissional";

  const rows = [];

  const proposedStartAt = proposed.startAt ?? session.startAt;
  if (proposed.startAt && proposed.startAt !== session.startAt) {
    rows.push({
      key: "startAt",
      label: "Início",
      before: formatSessionDateTime(session.startAt),
      after: formatSessionDateTime(proposedStartAt),
    });
  }

  const proposedEndAt = computeProposedEndAt(proposed, session);
  if (
    (proposed.startAt && proposed.startAt !== session.startAt) ||
    (proposed.durationMinutes && proposed.durationMinutes !== session.durationMinutes)
  ) {
    if (proposedEndAt !== session.endAt) {
      rows.push({
        key: "endAt",
        label: "Término",
        before: formatSessionDateTime(session.endAt),
        after: formatSessionDateTime(proposedEndAt),
      });
    }
  }

  if (proposed.durationMinutes && proposed.durationMinutes !== session.durationMinutes) {
    rows.push({
      key: "duration",
      label: "Duração",
      before: `${session.durationMinutes} min`,
      after: `${proposed.durationMinutes} min`,
    });
  }

  if (proposed.roomId && proposed.roomId !== session.roomId?._id) {
    rows.push({
      key: "room",
      label: "Sala",
      before: getSessionRoomNameFromSession(session),
      after: resolveRoomName(proposed.roomId, rooms, session),
    });
  }

  if (proposed.sessionTypeId && proposed.sessionTypeId !== session.sessionTypeId?._id) {
    rows.push({
      key: "sessionType",
      label: "Modalidade",
      before: getSessionModalityName(session),
      after: resolveSessionTypeName(proposed.sessionTypeId, sessionTypes, session),
    });
  }

  if (proposed.modality && proposed.modality !== session.modality) {
    rows.push({
      key: "modality",
      label: "Tipo de sessão",
      before: getSessionFormatLabel(session.modality),
      after: SESSION_FORMAT_LABELS[proposed.modality] ?? proposed.modality,
    });
  }

  if (proposed.notes !== undefined && proposed.notes !== session.notes) {
    rows.push({
      key: "notes",
      label: "Notas",
      before: session.notes?.trim() || "(vazio)",
      after: String(proposed.notes ?? "").trim() || "(vazio)",
    });
  }

  if (request.updateScope && request.updateScope !== "SINGLE") {
    rows.push({
      key: "scope",
      label: "Escopo",
      before: "Somente este evento",
      after: scopeLabel(request.updateScope),
    });
  }

  const proposedPatientIds = normalizeIdList(proposed.patientIds);
  const currentPatients = getSessionPatients(session);
  const patientLabels = idListDiff(
    currentPatients.map((item) => item.id),
    proposedPatientIds.length > 0 ? proposedPatientIds : currentPatients.map((item) => item.id),
    resolvePatientLabel,
  );

  const currentProfessionals = getSessionProfessionals(session);
  const proposedProfessionalIds =
    Array.isArray(proposed.professionals) && proposed.professionals.length > 0
      ? proposed.professionals.map((item) => item.professionalId ?? item.id).filter(Boolean)
      : normalizeIdList(proposed.professionalIds);
  const professionalLabels = idListDiff(
    currentProfessionals.map((item) => item.id),
    proposedProfessionalIds.length > 0
      ? proposedProfessionalIds
      : currentProfessionals.map((item) => item.id),
    resolveProfessionalLabel,
  );

  return { rows, patientLabels, professionalLabels };
}

export function SessionChangeRequestDiff({ request, rooms = [], sessionTypes = [] }) {
  if (request.type === "CANCEL") {
    return (
      <div className="space-y-2">
        <div className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Cancelamento</p>
          <p className="mt-1 text-sm text-destructive">
            <span className="font-medium">Motivo: </span>
            {request.proposedPayload?.cancelReason ?? "—"}
          </p>
          {request.updateScope ? (
            <p className="mt-1 text-xs text-destructive/80">
              Escopo: {scopeLabel(request.updateScope)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const diff = buildEditDiff(request, { rooms, sessionTypes });
  const hasParticipantChanges =
    diff.patientLabels.removed.length > 0 ||
    diff.patientLabels.added.length > 0 ||
    diff.professionalLabels.removed.length > 0 ||
    diff.professionalLabels.added.length > 0;

  if (diff.rows.length === 0 && !hasParticipantChanges) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma alteração detectada nos dados salvos.</p>
    );
  }

  return (
    <div className="space-y-2">
      {diff.rows.map((row) => (
        <DiffRow key={row.key} label={row.label} before={row.before} after={row.after} />
      ))}
      <ListDiff label="Usuários" {...diff.patientLabels} />
      <ListDiff label="Profissionais" {...diff.professionalLabels} />
    </div>
  );
}
