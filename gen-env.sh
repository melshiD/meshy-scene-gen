#!/usr/bin/env bash
# gen-env.sh — RUN ON THE BOX (lodestar-core-1), in /opt/lodestar/apps/meshy-scene-gen.
# Writes .env from vault values + the app's LiteLLM virtual key. Secrets are pasted (hidden) and
# never leave the box / never reach a build session.
#
# Vault sources (Infisical, env prod):
#   LiteLLM key    -> mint on box:  cd /opt/lodestar/litellm && ./mint-app-key.sh meshy-scene-gen 25 30d "gpt-4o-mini,dall-e-3"
#                     (then store it at /app/meshy-scene-gen:LITELLM_KEY)
#   MESHY_API_KEY  -> /provider/meshy:API_KEY
#   DATABASE_URL   -> /app/meshy-scene-gen:DATABASE_URL   (minted by core-postgres/provision-db.sh)
#
# Assets (meshes/images/manifests) also live in the database (Asset table via /api/assets) —
# no object-storage config needed.
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  echo "ERROR: .env already exists — refusing to overwrite. Remove it deliberately to regenerate." >&2
  exit 1
fi

echo "Paste the app's secrets (input hidden, Enter after each):"
read -rsp "  OPENAI_API_KEY = LiteLLM virtual key (sk-..., NOT a real OpenAI key): " LITELLM_KEY; echo
read -rsp "  MESHY_API_KEY  = /provider/meshy:API_KEY:                            " MESHY_KEY;   echo
read -rsp "  DATABASE_URL   = /app/meshy-scene-gen:DATABASE_URL:                  " DB_URL;      echo
[[ -n "$LITELLM_KEY" && -n "$MESHY_KEY" && -n "$DB_URL" ]] \
  || { echo "ERROR: all three values are required." >&2; exit 1; }

umask 077
cat > .env <<EOF
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) on $(hostname) by gen-env.sh. DO NOT COMMIT.
NODE_ENV=production
PORT=3000
# LLM calls go to LiteLLM (OpenAI-compatible) — the openai SDK reads OPENAI_BASE_URL from env.
# Models used: gpt-4o-mini (prompt decomposition) + dall-e-3 (backgrounds), metered per this key.
OPENAI_BASE_URL=http://litellm:4000/v1
OPENAI_API_KEY=${LITELLM_KEY}
MESHY_API_KEY=${MESHY_KEY}
# Tenant db on the shared core-Postgres — holds jobs, presets, AND binary assets (Asset table).
# prisma migrate deploy runs at container start.
DATABASE_URL=${DB_URL}
EOF
chmod 600 .env

cat <<EOF

.env written (chmod 600). LLM traffic -> LiteLLM (metered as meshy-scene-gen); ALL state incl.
assets -> core-postgres. Next: docker compose build && docker compose up -d
EOF
