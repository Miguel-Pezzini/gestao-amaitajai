import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { withAuthTransport } from "./helpers/auth-transport-test.js";
import { createUser, loginAndGetCookie, loginAs, withAuth } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Autenticação", () => {
  useIntegrationTestDatabase();

  it("autentica com credenciais válidas e define cookie de sessão", async () => {
    await withAuthTransport("cookie", async (cookieApp) => {
      const password = "senha123456";
      const user = await createUser({
        name: "Maria Admin",
        email: "maria@auth.test",
        password,
        role: "ADMINISTRADOR",
      });

      const response = await request(cookieApp)
        .post("/api/auth/login")
        .send({ email: user.email, password });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: user.email,
        role: "ADMINISTRADOR",
        accountStatus: "ATIVO",
      });
      expect(response.headers["set-cookie"]?.[0]).toMatch(/ama_access_token=/);
    });
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
      role: "TECNICO",
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

  it("expõe sessão em /auth/me com Authorization Bearer", async () => {
    const password = "bearer123456";
    const user = await createUser({
      name: "Usuario Bearer",
      email: "bearer@auth.test",
      password,
      role: "TECNICO",
    });

    const token = await loginAs(user.email, password);
    const withBearer = await withAuth(request(app).get("/api/auth/me"), token);

    expect(withBearer.status).toBe(200);
    expect(withBearer.body.user.email).toBe(user.email);
  });

  it("expõe sessão em /auth/me apenas com cookie válido", async () => {
    await withAuthTransport("cookie", async (cookieApp) => {
      const password = "me123456";
      const user = await createUser({
        name: "Usuario Me",
        email: "me@auth.test",
        password,
        role: "TECNICO",
      });

      const withoutCookie = await request(cookieApp).get("/api/auth/me");
      expect(withoutCookie.status).toBe(401);

      const cookie = await loginAndGetCookie(user.email, password, cookieApp);
      const withCookie = await request(cookieApp).get("/api/auth/me").set("Cookie", cookie);

      expect(withCookie.status).toBe(200);
      expect(withCookie.body.user.email).toBe(user.email);
    });
  });

  it("bloqueia /auth/me para conta inativa mesmo após login", async () => {
    const password = "inativa123";
    const user = await createUser({
      name: "Inativo",
      email: "inativo@auth.test",
      password,
      role: "TECNICO",
    });

    const token = await loginAs(user.email, password);

    await prisma.user.update({
      where: { id: user._id },
      data: { accountStatus: "INATIVO" },
    });

    const me = await withAuth(request(app).get("/api/auth/me"), token);

    expect(me.status).toBe(403);
    expect(me.body.message).toMatch(/inativa/i);
  });

  it("retorna token no body quando AUTH_TRANSPORT=bearer", async () => {
    await withAuthTransport("bearer", async (bearerApp) => {
      const password = "bearer-mode123";
      const user = await createUser({
        name: "Bearer Mode",
        email: "bearermode@auth.test",
        password,
        role: "TECNICO",
      });

      const response = await request(bearerApp)
        .post("/api/auth/login")
        .send({ email: user.email, password });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.headers["set-cookie"]).toBeUndefined();

      const me = await request(bearerApp)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${response.body.token}`);

      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(user.email);
    });
  });

  it("realiza logout e limpa o cookie de sessão", async () => {
    await withAuthTransport("cookie", async (cookieApp) => {
      const password = "logout123";
      const user = await createUser({
        name: "Logout",
        email: "logout@auth.test",
        password,
        role: "ADMINISTRADOR",
      });

      const cookie = await loginAndGetCookie(user.email, password, cookieApp);

      const logout = await request(cookieApp).post("/api/auth/logout").set("Cookie", cookie);
      expect(logout.status).toBe(200);
      expect(logout.headers["set-cookie"]?.[0]).toMatch(/ama_access_token=;/);

      const meWithoutCookie = await request(cookieApp).get("/api/auth/me");
      expect(meWithoutCookie.status).toBe(401);
    });
  });
});
