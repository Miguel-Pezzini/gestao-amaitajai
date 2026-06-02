import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import {
  connectDatabase,
  disconnectDatabase,
  resetDatabaseForTests,
} from "../../src/config/database.js";
import { prisma } from "../../src/db/prisma.js";
import { createUser, loginAndGetCookie } from "./helpers/test-helpers.js";

describe("Autenticação", () => {
  beforeAll(async () => {
    await connectDatabase();
  }, 15000);

  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  afterAll(async () => {
    await disconnectDatabase();
  }, 15000);

  it("autentica com credenciais válidas e define cookie de sessão", async () => {
    const password = "senha123456";
    const user = await createUser({
      name: "Maria Admin",
      email: "maria@auth.test",
      password,
      role: "administrador",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: user.email,
      role: "administrador",
      isActive: true,
    });
    expect(response.headers["set-cookie"]?.[0]).toMatch(/ama_access_token=/);
  });

  it("rejeita login sem e-mail ou senha", async () => {
    const missingEmail = await request(app).post("/api/auth/login").send({ password: "x" });
    const missingPassword = await request(app).post("/api/auth/login").send({ email: "a@b.com" });

    expect(missingEmail.status).toBe(400);
    expect(missingPassword.status).toBe(400);
  });

  it("rejeita credenciais inválidas", async () => {
    await createUser({
      name: "Tecnico",
      email: "tec@auth.test",
      password: "correta123",
      role: "tecnico",
    });

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: "tec@auth.test", password: "errada123" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "naoexiste@auth.test", password: "correta123" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toMatch(/inválidas/i);
  });

  it("expõe sessão em /auth/me apenas com cookie válido", async () => {
    const password = "me123456";
    const user = await createUser({
      name: "Usuario Me",
      email: "me@auth.test",
      password,
      role: "tecnico",
    });

    const withoutCookie = await request(app).get("/api/auth/me");
    expect(withoutCookie.status).toBe(401);

    const cookie = await loginAndGetCookie(user.email, password);
    const withCookie = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(withCookie.status).toBe(200);
    expect(withCookie.body.user.email).toBe(user.email);
  });

  it("bloqueia /auth/me para conta inativa mesmo após login", async () => {
    const password = "inativa123";
    const user = await createUser({
      name: "Inativo",
      email: "inativo@auth.test",
      password,
      role: "tecnico",
    });

    await prisma.user.update({
      where: { id: user._id },
      data: { isActive: false },
    });

    const cookie = await loginAndGetCookie(user.email, password);
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(me.status).toBe(403);
    expect(me.body.message).toMatch(/inativa/i);
  });

  it("realiza logout e limpa o cookie de sessão", async () => {
    const password = "logout123";
    const user = await createUser({
      name: "Logout",
      email: "logout@auth.test",
      password,
      role: "administrador",
    });

    const cookie = await loginAndGetCookie(user.email, password);

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"]?.[0]).toMatch(/ama_access_token=;/);

    const meWithoutCookie = await request(app).get("/api/auth/me");
    expect(meWithoutCookie.status).toBe(401);
  });
});
