import mongoose from "mongoose";
import { env } from "./env.js";
import { Room } from "../models/room.model.js";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  await Room.syncIndexes();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
