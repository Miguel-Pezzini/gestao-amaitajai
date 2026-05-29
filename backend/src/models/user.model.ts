import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["administrador", "tecnico"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ACCOUNT_STATUSES = ["pendente", "ativo", "inativo"] as const;
export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
      default: "tecnico",
      index: true,
    },
    accountStatus: {
      type: String,
      required: true,
      enum: USER_ACCOUNT_STATUSES,
      default: "ativo",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = mongoose.model("User", userSchema);
