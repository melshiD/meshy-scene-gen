#!/usr/bin/env bash
# gen-env.sh — RUN ON THE BOX (lodestar-core-1), in /opt/lodestar/apps/meshy-scene-gen.
# Writes .env from vault values + the app's LiteLLM virtual key. Secrets are pasted (hidden) and
# never leave the box / never reach a build session.
#
# Vault sources (Infisical, env prod):
#   LiteLLM key    -> mint on box:  cd /opt/lodestar/litellm && ./mint-app-key.sh meshy-scene-gen 25 30d "gpt-4o-mini,dall-e-3"
#                     (then store it at /app/meshy-scene-gen:LITELLM_KEY)
#   MESHY_API_KEY  -> /provider/meshy:API_KEY
#   R2 credentials -> /provider/cloudflare-r2:{ACCESS_KEY_ID, SECRET_ACCESS_KEY, ACCOUNT_ID}
#   DATABASE_URL   -> /app/meshy-scene-gen:DATABASE_URL   (minted by core-postgres/provision-db.sh)
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  echo "ERROR: .env already exists — refusing to overwrite. Remove it deliberately to regenerate." >&2
  exit 1
fi

echo "Paste the app's SECRETS (input hidden, Enter after each):"
read -rsp "  OPENAI_API_KEY       = LiteLLM virtual key (sk-..., NOT a real OpenAI key):   " LITELLM_KEY;   echo
read -rsp "  MESHY_API_KEY        = /provider/meshy:API_KEY:                              " MESHY_KEY;     echo
read -rsp "  R2_ACCESS_KEY_ID     = /provider/cloudflare-r2:ACCESS_KEY_ID:                " R2_AK;         echo
read -rsp "  R2_SECRET_ACCESS_KEY = /provider/cloudflare-r2:SECRET_ACCESS_KEY:            " R2_SK;         echo
read -rsp "  R2_ACCOUNT_ID        = /provider/cloudflare-r2:ACCOUNT_ID:                   " R2_ACCT;       echo
read -rsp "  DATABASE_URL         = /app/meshy-scene-gen:DATABASE_URL:                    " DB_URL;        echo
[[ -n "$LITELLM_KEY" && -n "$MESHY_KEY" && -n "$R2_AK" && -n "$R2_SK" && -n "$R2_ACCT" && -n "$DB_URL" ]] \
  || { echo "ERROR: all six secret values are required." >&2; exit 1; }

echo ""
echo "Now the CONFIG values (visible; not secrets):"
read -rp  "  R2_BUCKET_NAME       = the R2 bucket for generated assets:                   " R2_BUCKET
read -rp  "  STORAGE_PUBLIC_URL   = public base URL for that bucket (https://...):        " PUB_URL
[[ -n "$R2_BUCKET" && -n "$PUB_URL" ]] || { echo "ERROR: both config values are required." >&2; exit 1; }

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
# Cloudflare R2 (S3-compatible) — presence of these four switches the app to the R2 storage provider.
R2_ACCESS_KEY_ID=${R2_AK}
R2_SECRET_ACCESS_KEY=${R2_SK}
R2_ACCOUNT_ID=${R2_ACCT}
R2_BUCKET_NAME=${R2_BUCKET}
STORAGE_PUBLIC_URL=${PUB_URL}
# Tenant db on the shared core-Postgres (prisma migrate deploy runs at container start).
DATABASE_URL=${DB_URL}
EOF
chmod 600 .env

cat <<EOF

.env written (chmod 600). LLM traffic -> LiteLLM (metered as meshy-scene-gen); assets -> R2
(${R2_BUCKET}); state -> core-postgres. Next: docker compose build && docker compose up -d
EOF
