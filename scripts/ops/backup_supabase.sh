#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Missing SUPABASE_DB_URL"
  exit 1
fi

STAMP=$(date +"%Y%m%d-%H%M%S")
OUT_DIR=${OUT_DIR:-./backups}
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/fashionfit-$STAMP.dump"

pg_dump "$SUPABASE_DB_URL" --format=custom --file "$OUT_FILE"

echo "Backup created: $OUT_FILE"
