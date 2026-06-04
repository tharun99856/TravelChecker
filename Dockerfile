# ── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:22-bookworm AS builder

# Install native build tools for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install ALL deps (incl. TypeScript and tsx) so tsc can compile
COPY package.json package-lock.json ./
RUN npm ci

# Compile TypeScript
COPY tsconfig.json ./
COPY src/ src/
RUN npx tsc

# Strip dev dependencies for the runtime image
RUN npm prune --omit=dev

# ── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM node:22-bookworm-slim

WORKDIR /app

# Copy compiled output + pruned node_modules + web assets
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package.json ./
COPY src/web/ ./dist/web/

EXPOSE 3001

CMD ["node", "dist/server.js"]
