import "dotenv/config";

process.env.NODE_ENV = "test";

const requiredTestEnv = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "TEST_MONGODB_URI"] as const;

for (const key of requiredTestEnv) {
  if (!process.env[key]) {
    throw new Error(`Variável obrigatória para testes ausente: ${key}`);
  }
}

process.env.BCRYPT_SALT_ROUNDS = process.env.TEST_BCRYPT_SALT_ROUNDS ?? "4";

function buildMongoUriWithDatabase(uri: string, databaseName: string): string {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/);
  if (!match) {
    throw new Error("MONGODB_URI inválida para testes.");
  }

  const base = match[1];
  const query = match[2] ?? "";
  return `${base}/${databaseName}${query}`;
}

const testDbName = `gestao_amaitajai_test_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 8)}`;
const sourceTestMongoUri = process.env.TEST_MONGODB_URI as string;
const testMongoUri = buildMongoUriWithDatabase(sourceTestMongoUri, testDbName);

process.env.TEST_MONGODB_DB_NAME = testDbName;
process.env.TEST_MONGODB_URI = testMongoUri;
