import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";
import { SESSION_MODALITIES } from "./session-type.model.js";

const sessionModalitySettingSchema = new mongoose.Schema(
  {
    modality: {
      type: String,
      required: true,
      unique: true,
      enum: SESSION_MODALITIES,
    },
    minPatients: {
      type: Number,
      required: true,
      min: 1,
    },
    maxPatients: {
      type: Number,
      required: true,
      min: 1,
    },
    minProfessionals: {
      type: Number,
      required: true,
      min: 1,
    },
    maxProfessionals: {
      type: Number,
      required: true,
      min: 1,
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

sessionModalitySettingSchema.pre("validate", function validateMinMax() {
  if (this.maxPatients < this.minPatients) {
    this.invalidate("maxPatients", "maxPatients deve ser maior ou igual a minPatients.");
  }
  if (this.maxProfessionals < this.minProfessionals) {
    this.invalidate(
      "maxProfessionals",
      "maxProfessionals deve ser maior ou igual a minProfessionals.",
    );
  }
});

sessionModalitySettingSchema.index({ modality: 1 }, { unique: true });

export type SessionModalitySettingDocument = HydratedDocument<
  InferSchemaType<typeof sessionModalitySettingSchema>
>;

export const SessionModalitySetting = mongoose.model(
  "SessionModalitySetting",
  sessionModalitySettingSchema,
);
