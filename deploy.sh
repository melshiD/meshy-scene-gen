#!/usr/bin/env bash
# deploy.sh — RUN ON THE LAPTOP (Git Bash), from the meshy_scene_gen repo root. Ships source to the
# core box, builds the image ON the box, and brings the app up on the lodestar_apps network.
# Secrets are NOT shipped: .env is generated on the box by gen-env.sh. Mirrors opinion-generator.
set -euo pipefail
cd "$(dirname "$0")"

HOST="${LODESTAR_HOST:-lodestar@lodestar-core-1}"   # reach by NAME over the tailnet (IP-agnostic)
DEST="/opt/lodestar/apps/meshy-scene-gen"

echo "==> Shipping source to ${HOST}:${DEST} (excluding node_modules/.next/.git/.env/generated assets)"
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env --exclude=.env.local \
    --exclude='*.log' --exclude=tsconfig.tsbuildinfo --exclude=public/generated --exclude=nul \
    -czf - . \
  | ssh "$HOST" "sudo mkdir -p '$DEST' && sudo chown \$(id -un):\$(id -gn) '$DEST' && tar -C '$DEST' -xzf - && chmod +x '$DEST'/*.sh 2>/dev/null || true"

if ssh "$HOST" "test -f '$DEST/.env'"; then
  echo "==> .env present on box — building image and (re)starting the app"
  ssh "$HOST" "cd '$DEST' && docker compose build && docker compose up -d && docker compose ps"
  echo "==> Done. Operator test on the box:  curl -s http://127.0.0.1:3002/ | head"
else
  cat <<EOF

==> Source shipped, but NO .env on the box yet. On the box, one-time:

  # 1) Mint the app's LiteLLM virtual key (prints sk-... — that IS the app's OPENAI_API_KEY):
  cd /opt/lodestar/litellm && ./mint-app-key.sh meshy-scene-gen 25 30d "gpt-4o-mini,dall-e-3"

  # 2) Write the app .env from the vault (+ paste that virtual key):
  cd ${DEST} && ./gen-env.sh

  # 3) Build + up:
  docker compose build && docker compose up -d && docker compose ps

Then re-run this script (or 'docker compose up -d' on the box) for subsequent deploys.
EOF
fi
