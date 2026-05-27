import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: null,
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
roomSchema.index({ code: 1 }, { unique: true, sparse: true });

export type RoomDocument = HydratedDocument<InferSchemaType<typeof roomSchema>>;

export const Room = mongoose.model("Room", roomSchema);
