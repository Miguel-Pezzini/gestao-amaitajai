import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { ensureInitialAdminUser } from "./services/auth.service.js";

async function start(): Promise<void> {
  await connectDatabase();
  await ensureInitialAdminUser();

  const server = app.listen(env.port, () => {
    console.log(`API em http://localhost:${env.port}`);
    console.log(`PostgreSQL conectado`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Encerrando (${signal})...`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

start().catch((error: unknown) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
