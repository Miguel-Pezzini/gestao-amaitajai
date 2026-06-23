import { prisma } from "../db/prisma.js";
import { serializePatientRef, serializePopulatedNameRef } from "../db/serialize.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/http-errors.js";
import type { AuthUser } from "../types/express.js";
import { isUuid } from "../validators/agenda/agenda.utils.js";
import { validateAttendancePayload } from "../validators/patient-attendance.validator.js";

const attendanceUserInclude = {
  attendanceUpdatedBy: { select: { id: true, name: true } },
} as const;

type SessionWithParticipants = {
  id: string;
  status: string;
  patients: Array<{ patientId: string }>;
  professionals: Array<{ professionalId: string }>;
};

function serializeAttendance(
  row: {
    attendanceStatus: string;
    attendanceJustification: string;
    attendanceUpdatedAt: Date | null;
    attendanceUpdatedBy?: { id: string; name: string } | null;
  },
) {
  return {
    status: row.attendanceStatus,
    justification: row.attendanceJustification,
    updatedAt: row.attendanceUpdatedAt,
    updatedBy: serializePopulatedNameRef(row.attendanceUpdatedBy ?? null),
  };
}

class PatientAttendanceService {
  private assertCanAccessSession(
    session: SessionWithParticipants,
    currentUser: AuthUser,
    options: { requireWritable?: boolean } = {},
  ): void {
    if (options.requireWritable && session.status === "CANCELADA") {
      throw new ValidationError("Não é possível registrar presença em sessão cancelada.");
    }

    if (currentUser.role === "RECEPCAO") {
      throw new ForbiddenError("Perfil sem permissão para acessar presença.");
    }

    if (currentUser.role === "TECNICO") {
      const isProfessional = session.professionals.some(
        (row) => row.professionalId === currentUser._id,
      );
      if (!isProfessional) {
        throw new ForbiddenError("Técnico só pode acessar presença da própria sessão.");
      }
    }
  }

  private async findSessionOrThrow(sessionId: string): Promise<SessionWithParticipants> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });

    if (!session) {
      throw new NotFoundError("Sessão não encontrada.");
    }

    return session;
  }

  private assertPatientInSession(session: SessionWithParticipants, patientId: string): void {
    const isParticipant = session.patients.some((row) => row.patientId === patientId);
    if (!isParticipant) {
      throw new ValidationError("O usuário não participa desta sessão.");
    }
  }

  async listSessionAttendance(sessionId: string, currentUser: AuthUser) {
    const session = await this.findSessionOrThrow(sessionId);
    this.assertCanAccessSession(session, currentUser);

    const patientIds = session.patients.map((row) => row.patientId);
    if (patientIds.length === 0) {
      return { items: [] };
    }

    const [attendanceRows, patients] = await Promise.all([
      prisma.sessionPatient.findMany({
        where: { sessionId },
        include: attendanceUserInclude,
      }),
      prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: {
          id: true,
          fullName: true,
          fundingSource: { select: { id: true, name: true } },
        },
      }),
    ]);

    const attendanceByPatientId = new Map(
      attendanceRows.map((row) => [row.patientId, serializeAttendance(row)]),
    );

    const items = patients.map((patient) => ({
      patient: serializePatientRef(patient),
      current: attendanceByPatientId.get(patient.id) ?? {
        status: "PRESENTE",
        justification: "",
        updatedAt: null,
        updatedBy: null,
      },
    }));

    return { items };
  }

  async upsertSessionAttendance(
    sessionId: string,
    patientId: string,
    payload: Record<string, unknown>,
    currentUser: AuthUser,
  ) {
    if (!isUuid(patientId)) {
      throw new ValidationError("Identificador de usuário inválido.");
    }

    const session = await this.findSessionOrThrow(sessionId);
    this.assertCanAccessSession(session, currentUser, { requireWritable: true });
    this.assertPatientInSession(session, patientId);

    const { status, justification } = validateAttendancePayload(payload);

    const attendance = await prisma.sessionPatient.update({
      where: {
        sessionId_patientId: {
          sessionId,
          patientId,
        },
      },
      data: {
        attendanceStatus: status,
        attendanceJustification: justification,
        attendanceUpdatedById: currentUser._id,
        attendanceUpdatedAt: new Date(),
      },
      include: attendanceUserInclude,
    });

    return { attendance: serializeAttendance(attendance) };
  }
}

export const patientAttendanceService = new PatientAttendanceService();
