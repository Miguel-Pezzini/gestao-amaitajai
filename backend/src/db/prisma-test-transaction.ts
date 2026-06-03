import { PrismaClient } from "@prisma/client";

const TEST_ROLLBACK = "TEST_ROLLBACK";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const state: {
  tx: TransactionClient | null;
  rollback: (() => void) | null;
  runPromise: Promise<void> | null;
} = {
  tx: null,
  rollback: null,
  runPromise: null,
};

export function createTestAwarePrismaClient(base: PrismaClient): PrismaClient {
  return base.$extends({
    client: {
      $transaction(
        arg: unknown,
        options?: unknown,
      ) {
        if (state.tx) {
          if (typeof arg === "function") {
            return arg(state.tx);
          }
          throw new Error("Batch $transaction não suportado em testes.");
        }
        return base.$transaction(arg as never, options as never);
      },
    },
    query: {
      $queryRaw({ args, query }) {
        if (state.tx) {
          return state.tx.$queryRaw(args as never);
        }
        return query(args);
      },
      $executeRaw({ args, query }) {
        if (state.tx) {
          return state.tx.$executeRaw(args as never);
        }
        return query(args);
      },
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (state.tx) {
            const delegate = state.tx[model as keyof TransactionClient] as unknown as Record<
              string,
              (input: unknown) => unknown
            >;
            return delegate[operation](args);
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

export async function beginTestTransaction(base: PrismaClient): Promise<void> {
  if (state.tx) {
    throw new Error("Transação de teste já ativa.");
  }

  let release!: () => void;
  const txReady = new Promise<void>((resolve) => {
    release = resolve;
  });

  state.runPromise = base
    .$transaction(async (tx) => {
      state.tx = tx;
      release();
      await new Promise<void>((_, reject) => {
        state.rollback = () => reject(new Error(TEST_ROLLBACK));
      });
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.message === TEST_ROLLBACK) {
        return;
      }
      throw error;
    }) as Promise<void>;

  await txReady;
}

export async function rollbackTestTransaction(): Promise<void> {
  if (!state.rollback || !state.runPromise) {
    return;
  }

  state.rollback();
  await state.runPromise;
  state.tx = null;
  state.rollback = null;
  state.runPromise = null;
}
