import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import {
  beginTestTransaction,
  connectDatabase,
  disconnectDatabase,
  resetDatabaseForTests,
  rollbackTestTransaction,
} from "../../../src/config/database.js";

/**
 * Isolamento por transação: TRUNCATE uma vez no início do arquivo,
 * BEGIN/ROLLBACK por teste (substitui TRUNCATE em cada beforeEach).
 */
export function useIntegrationTestDatabase(): void {
  beforeAll(async () => {
    await connectDatabase();
    await resetDatabaseForTests();
  }, 15000);

  beforeEach(async () => {
    await beginTestTransaction();
  });

  afterEach(async () => {
    await rollbackTestTransaction();
  });

  afterAll(async () => {
    await disconnectDatabase();
  }, 15000);
}
