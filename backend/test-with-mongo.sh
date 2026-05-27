#!/bin/sh

set -e
set -a
. ./.env
set +a

: "${MONGO_TEST_CONTAINER_NAME:?MONGO_TEST_CONTAINER_NAME não definido no .env}"

cleanup() {
  docker compose -f docker-compose.test.yml stop mongodb_test >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker compose -f docker-compose.test.yml up -d mongodb_test

echo "Aguardando Mongo de teste ficar pronto..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$MONGO_TEST_CONTAINER_NAME" 2>/dev/null)" = "healthy" ]
do
  sleep 1
done

vitest run
