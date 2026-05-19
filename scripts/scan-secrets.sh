#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PATTERNS=(
  "sk-[A-Za-z0-9_-]{20,}"
  "OPENAI_API_KEY="
  "GOOGLE_API_KEY="
  "DASHSCOPE_API_KEY="
  "OPENROUTER_API_KEY="
  "XAI_API_KEY="
  "JWT_SECRET="
  "DATABASE_URL="
)

for pattern in "${PATTERNS[@]}"; do
  echo "== Scanning for: ${pattern} =="
  rg -n \
    --hidden \
    --glob '!**/.git/**' \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    --glob '!**/.venv/**' \
    --glob '!**/dist/**' \
    --glob '!**/build/**' \
    --glob '!**/coverage/**' \
    "${pattern}" \
    "${ROOT_DIR}" || true
  echo
done

echo "Review the matches carefully. Placeholder values inside .env.example files are acceptable; real secrets are not."
