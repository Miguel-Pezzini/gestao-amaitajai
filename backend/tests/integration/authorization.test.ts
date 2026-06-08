import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { createUser, loginAndGetCookie } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Autorização por perfil", () => {
  let adminCookie: string;
  let tecnicoCookie: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Authz",
      email: "admin@authz.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const tecnico = await createUser({
      name: "Tecnico Authz",
      email: "tecnico@authz.test",
      password: "tech123456",
      role: "TECNICO",
    });

    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
    tecnicoCookie = await loginAndGetCookie(tecnico.email, "tech123456");
  });

  describe("funcionários (/users)", () => {
    it("exige autenticação", async () => {
      const response = await request(app).get("/api/users");
      expect(response.status).toBe(401);
    });

    it("nega acesso ao técnico", async () => {
      const response = await request(app).get("/api/users").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });

    it("permite listagem ao administrador", async () => {
      const response = await request(app).get("/api/users").set("Cookie", adminCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("pacientes (/patients)", () => {
    it("permite listagem ao técnico autenticado", async () => {
      const response = await request(app).get("/api/patients").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("protocolos (/protocols)", () => {
    it("nega listagem ao técnico", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(403);
    });

    it("permite listagem ao administrador", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", adminCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("agenda — cadastro de salas", () => {
    it("nega criação de sala ao técnico", async () => {
      const response = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", tecnicoCookie)
        .send({ name: "Sala Bloqueada" });

      expect(response.status).toBe(403);
    });

    it("permite criação de sala ao administrador", async () => {
      const response = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "Sala Permitida" });

      expect(response.status).toBe(201);
      expect(response.body.room.name).toBe("Sala Permitida");
    });
  });
});
