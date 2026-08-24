#!/bin/sh
set -e

echo "→ Применяю миграции БД (prisma migrate deploy)..."
npx prisma migrate deploy

echo "→ Старт: $@"
exec "$@"
