import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";
import { SESSION_MODALITIES } from "./session-type.model.js";

export const SESSION_STATUSES = ["agendada", "realizada", "cancelada"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

type SessionValidationLimits = {
  minPatients: number;
  maxPatients: number;
  minProfessionals: number;
  maxProfessionals: number;
};

const SESSION_LIMITS: Record<string, SessionValidationLimits> = {
  individual: { minPatients: 1, maxPatients: 1, minProfessionals: 1, maxProfessionals: 1 },
  dupla: { minPatients: 2, maxPatients: 2, minProfessionals: 2, maxProfessionals: 2 },
  grupo: { minPatients: 1, maxPatients: 15, minProfessionals: 2, maxProfessionals: 4 },
};

const sessionSchema = new mongoose.Schema(
  {
    sessionTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionType",
      required: true,
      index: true,
    },
    modality: {
      type: String,
      required: true,
      enum: SESSION_MODALITIES,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: SESSION_STATUSES,
      default: "agendada",
      index: true,
    },
    patientIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Patient",
      required: true,
      validate: {
        validator: (values: unknown[]) => values.length > 0,
        message: "Sessão deve ter ao menos um paciente.",
      },
    },
    professionalIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: (values: unknown[]) => values.length > 0,
        message: "Sessão deve ter ao menos um profissional.",
      },
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

sessionSchema.pre("validate", function validateByModality() {
  const limits = SESSION_LIMITS[this.modality as string];
  if (!limits) {
    return;
  }

  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    this.invalidate("endAt", "endAt deve ser maior que startAt.");
  }

  if (this.patientIds.length < limits.minPatients || this.patientIds.length > limits.maxPatients) {
    this.invalidate(
      "patientIds",
      `Quantidade de pacientes inválida para modalidade ${this.modality}.`,
    );
  }

  if (
    this.professionalIds.length < limits.minProfessionals ||
    this.professionalIds.length > limits.maxProfessionals
  ) {
    this.invalidate(
      "professionalIds",
      `Quantidade de profissionais inválida para modalidade ${this.modality}.`,
    );
  }

  if (this.status === "cancelada" && !this.cancelReason?.trim()) {
    this.invalidate("cancelReason", "Cancelamento exige motivo.");
  }

});

sessionSchema.index({ startAt: 1, endAt: 1 });
sessionSchema.index({ professionalIds: 1, startAt: 1 });
sessionSchema.index({ patientIds: 1, startAt: 1 });
sessionSchema.index({ roomId: 1, startAt: 1, endAt: 1 });

export type SessionDocument = HydratedDocument<InferSchemaType<typeof sessionSchema>>;

export const Session = mongoose.model("Session", sessionSchema);
