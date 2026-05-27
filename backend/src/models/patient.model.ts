import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const FUNDING_SOURCES = ["Municipal", "Estadual", "Particular"] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    fundingSource: {
      type: String,
      required: true,
      enum: FUNDING_SOURCES,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

patientSchema.index({ fullName: "text", guardianName: "text" });
patientSchema.index({ fundingSource: 1, isActive: 1, fullName: 1 });

export type PatientDocument = HydratedDocument<InferSchemaType<typeof patientSchema>>;

export const Patient = mongoose.model("Patient", patientSchema);
