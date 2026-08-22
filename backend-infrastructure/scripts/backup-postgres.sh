#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="backups/james_crm_${STAMP}.sql.gz"

docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-jamescrm}" "${POSTGRES_DB:-james_crm}" | gzip -9 > "$FILE"
find backups -type f -name 'james_crm_*.sql.gz' -mtime +14 -delete

echo "Created $FILE"
