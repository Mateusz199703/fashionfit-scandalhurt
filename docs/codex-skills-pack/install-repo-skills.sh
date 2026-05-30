#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$PWD}"
mkdir -p "$TARGET_DIR/.agents/skills"
cp -R "$(dirname "$0")/.agents/skills/"* "$TARGET_DIR/.agents/skills/"

echo "Installed Codex skills into: $TARGET_DIR/.agents/skills"
echo "Restart Codex or run /skills inside Codex to check available skills."
