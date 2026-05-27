import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const SESSION_MODALITIES = ["individual", "dupla", "grupo"] as const;
export type SessionModality = (typeof SESSION_MODALITIES)[number];

const sessionTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    defaultDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    isDurationFlexible: {
      type: Boolean,
      default: false,
    },
    allowedModalities: {
      type: [String],
      required: true,
      enum: SESSION_MODALITIES,
      validate: {
        validator: (values: string[]) => values.length > 0,
        message: "allowedModalities deve conter ao menos uma modalidade.",
      },
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

sessionTypeSchema.index({ slug: 1 }, { unique: true });
sessionTypeSchema.index({ name: 1 });

export type SessionTypeDocument = HydratedDocument<
  InferSchemaType<typeof sessionTypeSchema>
>;

export const SessionType = mongoose.model("SessionType", sessionTypeSchema);
