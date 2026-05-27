import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

roomSchema.index({ name: 1 }, { unique: true });

export type RoomDocument = HydratedDocument<InferSchemaType<typeof roomSchema>>;

export const Room = mongoose.model("Room", roomSchema);
