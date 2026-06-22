import type { Express } from "express";
import { vi } from "vitest";

/** Reimporta app com AUTH_TRANSPORT temporário (env é lido no import de env.ts). */
export async function withAuthTransport<T>(
  transport: "cookie" | "bearer",
  fn: (app: Express) => Promise<T>,
): Promise<T> {
  const previousTransport = process.env.AUTH_TRANSPORT;
  process.env.AUTH_TRANSPORT = transport;
  vi.resetModules();

  const { default: transportApp } = await import("../../../src/app.js");

  try {
    return await fn(transportApp);
  } finally {
    process.env.AUTH_TRANSPORT = previousTransport;
    vi.resetModules();
  }
}
