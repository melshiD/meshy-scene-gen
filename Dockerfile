# meshy-scene-gen — Next.js 14 + Prisma (Postgres on lodestar core-PG) + Cloudflare R2 assets.
# Built + run on lodestar-core-1. LLM calls route through LiteLLM (OpenAI-compatible) via
# OPENAI_BASE_URL; assets go to R2; job/preset state to core-postgres — the container is stateless.
# syntax=docker/dockerfile:1

FROM node:20-slim AS base
# Prisma's query engine needs openssl at build + runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# This repo uses pnpm (pnpm-lock.yaml, lockfile v10).
RUN npm install -g pnpm@10
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Unlike opinion-generator, no build-stage placeholder keys are needed: every client (OpenAI, Meshy,
# S3/R2, Prisma) is lazily instantiated inside functions, and `next build` never invokes handlers.
RUN npx prisma generate && pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Full tree (node_modules incl. prisma CLI + engine, .next, prisma migrations, src). Same simple
# whole-tree pattern as opinion-generator; image size is a non-issue on this box.
COPY --from=build /app ./
EXPOSE 3000
# On start: apply pending migrations to the core-PG tenant db, then serve.
# Bind 0.0.0.0 so the app is reachable in-cluster (http://meshy-scene-gen:3000) + on the published port.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]
