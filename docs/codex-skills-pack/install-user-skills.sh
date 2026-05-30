#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$HOME/.agents/skills"
cp -R "$(dirname "$0")/.agents/skills/"* "$HOME/.agents/skills/"

echo "Installed Codex skills into: $HOME/.agents/skills"
echo "Restart Codex or run /skills inside Codex to check available skills."
