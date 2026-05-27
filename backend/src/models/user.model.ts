import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

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
      required: true,
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
