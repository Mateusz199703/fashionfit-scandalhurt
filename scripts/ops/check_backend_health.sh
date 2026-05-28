#!/usr/bin/env bash
set -euo pipefail

URL=${1:-"https://fashionfit-backend.onrender.com/health"}

RESP=$(curl -fsSL "$URL")
STATUS=$(echo "$RESP" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String(d.status||''));")
GOOGLE=$(echo "$RESP" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String(d.services?.tryon_providers?.googleConnectivity));")

if [[ "$STATUS" != "ok" ]]; then
  echo "Health FAILED: status=$STATUS"
  exit 2
fi

echo "Health OK | googleConnectivity=$GOOGLE"
