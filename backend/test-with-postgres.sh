#!/bin/sh

set -e
set -a
. ./.env
set +a

: "${POSTGRES_TEST_CONTAINER_NAME:?POSTGRES_TEST_CONTAINER_NAME não definido no .env}"

cleanup() {
  docker compose -f docker-compose.test.yml stop postgres_test >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker compose -f docker-compose.test.yml up -d postgres_test

echo "Aguardando PostgreSQL de teste ficar pronto..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$POSTGRES_TEST_CONTAINER_NAME" 2>/dev/null)" = "healthy" ]
do
  sleep 1
done

DATABASE_URL="$TEST_DATABASE_URL" DIRECT_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$TEST_DATABASE_URL" DIRECT_URL="$TEST_DATABASE_URL" vitest run
