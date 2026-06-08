import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import {
  authenticateGoogleCode,
  findOrProvisionGoogleUser,
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

  it("cria usuário ativo no primeiro login Google", async () => {
    const user = await findOrProvisionGoogleUser({
      googleId: "google-sub-2",
      email: "debora@amaitajai.org.br",
      name: "debora silva",
      hostedDomain: "amaitajai.org.br",
    });

    expect(user.name).toBe("Debora");
    expect(user.accountStatus).toBe("ativo");
    expect(user.passwordHash).toBeNull();
    expect(user.role).toBe("tecnico");
  });

  it("permite login Google para usuário ativo e autoativa conta pendente existente", async () => {
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

    await prisma.user.create({
      data: {
        name: "Legado",
        email: "legado@amaitajai.org.br",
        passwordHash: null,
        role: "tecnico",
        accountStatus: "pendente",
      },
    });

    const reactivated = await findOrProvisionGoogleUser({
      googleId: "google-sub-3",
      email: "legado@amaitajai.org.br",
      name: "legado usuario",
      hostedDomain: "amaitajai.org.br",
    });

    expect(reactivated.accountStatus).toBe("ativo");
  });

  it("permite administrador reativar usuário inativo", async () => {
    const adminPassword = "admin123456";
    const admin = await createUser({
      name: "Admin",
      email: "admin-auth@amaitajai.org.br",
      password: adminPassword,
      role: "administrador",
    });
    const adminCookie = await loginAndGetCookie(admin.email, adminPassword);

    const inactive = await prisma.user.create({
      data: {
        name: "Inativo",
        email: "inativo@amaitajai.org.br",
        passwordHash: null,
        role: "tecnico",
        accountStatus: "inativo",
      },
    });

    const response = await request(app)
      .patch(`/api/users/${inactive.id}/status`)
      .set("Cookie", adminCookie)
      .send({ accountStatus: "ativo" });

    expect(response.status).toBe(200);
    expect(response.body.user.accountStatus).toBe("ativo");
  });
});
