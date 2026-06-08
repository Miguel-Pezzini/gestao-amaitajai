import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import {
  authenticateGoogleCode,
  findOrProvisionGoogleUser,
  GoogleAuthError,
} from "../../src/services/google-auth.service.js";
import { createUser, loginAndGetCookie } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

vi.mock("../../src/services/google-auth.service.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/services/google-auth.service.js")>(
    "../../src/services/google-auth.service.js",
  );

  return {
    ...actual,
    authenticateGoogleCode: vi.fn(),
    exchangeCodeForGoogleProfile: vi.fn(),
  };
});

describe("Autenticação Google", () => {
  useIntegrationTestDatabase();

  it("rejeita login por senha com domínio fora de amaitajai.org.br", async () => {
    await createUser({
      name: "Externo",
      email: "externo@gmail.com",
      password: "senha123456",
      role: "tecnico",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "externo@gmail.com", password: "senha123456" });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("dominio_nao_permitido");
  });

  it("rejeita login por senha para conta pendente", async () => {
    await prisma.user.create({
      data: {
        name: "Pendente",
        email: "pendente@amaitajai.org.br",
        passwordHash: null,
        role: "tecnico",
        accountStatus: "pendente",
      },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "pendente@amaitajai.org.br", password: "qualquer123" });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("conta_pendente");
  });

  it("rejeita login por senha quando usuário não possui senha configurada", async () => {
    await prisma.user.create({
      data: {
        name: "Google",
        email: "google@amaitajai.org.br",
        passwordHash: null,
        googleId: "google-sub-1",
        role: "tecnico",
        accountStatus: "ativo",
      },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "google@amaitajai.org.br", password: "qualquer123" });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("senha_nao_configurada");
  });

  it("cria usuário pendente no primeiro login Google", async () => {
    const user = await findOrProvisionGoogleUser({
      googleId: "google-sub-2",
      email: "debora@amaitajai.org.br",
      name: "debora silva",
      hostedDomain: "amaitajai.org.br",
    });

    expect(user.name).toBe("Debora");
    expect(user.accountStatus).toBe("pendente");
    expect(user.passwordHash).toBeNull();
    expect(user.role).toBe("tecnico");
  });

  it("permite login Google para usuário ativo e bloqueia pendente no callback", async () => {
    const activeUser = await createUser({
      name: "Ativo",
      email: "ativo@amaitajai.org.br",
      password: "senha123456",
      role: "tecnico",
    });

    vi.mocked(authenticateGoogleCode).mockResolvedValueOnce({
      id: activeUser._id,
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role,
      accountStatus: "ativo",
      passwordHash: "hash",
      googleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const success = await request(app).get("/api/auth/google/callback?code=ok&state=abc").set("Cookie", [
      "ama_google_oauth_state=abc",
    ]);

    expect(success.status).toBe(302);
    expect(success.headers.location).toBe("http://localhost:5173/");

    const pendingUser = await findOrProvisionGoogleUser({
      googleId: "google-sub-3",
      email: "novo@amaitajai.org.br",
      name: "novo usuario",
      hostedDomain: "amaitajai.org.br",
    });

    vi.mocked(authenticateGoogleCode).mockRejectedValueOnce(new GoogleAuthError("conta_pendente"));

    const blocked = await request(app)
      .get("/api/auth/google/callback?code=blocked&state=def")
      .set("Cookie", ["ama_google_oauth_state=def"]);

    expect(blocked.status).toBe(302);
    expect(blocked.headers.location).toContain("error=conta_pendente");
    expect(pendingUser.accountStatus).toBe("pendente");
  });

  it("permite administrador ativar usuário pendente", async () => {
    const adminPassword = "admin123456";
    const admin = await createUser({
      name: "Admin",
      email: "admin-auth@amaitajai.org.br",
      password: adminPassword,
      role: "administrador",
    });
    const adminCookie = await loginAndGetCookie(admin.email, adminPassword);

    const pending = await prisma.user.create({
      data: {
        name: "Pendente",
        email: "ativar@amaitajai.org.br",
        passwordHash: null,
        role: "tecnico",
        accountStatus: "pendente",
      },
    });

    const response = await request(app)
      .patch(`/api/users/${pending.id}/status`)
      .set("Cookie", adminCookie)
      .send({ accountStatus: "ativo" });

    expect(response.status).toBe(200);
    expect(response.body.user.accountStatus).toBe("ativo");
  });
});
