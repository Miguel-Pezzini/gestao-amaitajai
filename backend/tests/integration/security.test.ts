import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../src/config/database.js";
import { createLoginRateLimiter } from "../../src/middlewares/login-rate-limit.middleware.js";

describe("API security hardening", () => {
  beforeAll(async () => {
    await connectDatabase();
  }, 15000);

  afterAll(async () => {
    await disconnectDatabase();
  }, 15000);

  describe("GET /api/health", () => {
    it("retorna status ok com banco disponível", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "ok",
        database: "ok",
      });
    });

    it("inclui headers de segurança do helmet", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeTruthy();
    });
  });

  describe("rate limit no login", () => {
    it("bloqueia após exceder o limite configurado", async () => {
      const loginApp = express();
      loginApp.use(express.json());
      const limiter = createLoginRateLimiter({ max: 2, windowMs: 60_000, skip: () => false });
      loginApp.post("/auth/login", limiter, (_req, res) => {
        res.status(401).json({ message: "Credenciais inválidas." });
      });

      const first = await request(loginApp).post("/auth/login").send({});
      const second = await request(loginApp).post("/auth/login").send({});
      const third = await request(loginApp).post("/auth/login").send({});

      expect(first.status).toBe(401);
      expect(second.status).toBe(401);
      expect(third.status).toBe(429);
      expect(third.body.message).toMatch(/tentativas de login/i);
    });
  });
});
