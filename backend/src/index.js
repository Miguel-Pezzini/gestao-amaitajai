import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { ensureInitialAdminUser } from "./services/auth.service.js";

async function start() {
  await connectDatabase();
  await ensureInitialAdminUser();

  const server = app.listen(env.port, () => {
    console.log(`API em http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`Encerrando (${signal})...`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
