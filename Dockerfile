# Multi-stage build. Stage 1 compiles TS, Stage 2 runs the slim output.
FROM node:22-bookworm AS builder

# better-sqlite3 needs C++ to build its native binding
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npx tsc

RUN npm prune --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app

COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package.json ./
COPY src/web/ ./dist/web/

EXPOSE 3001

CMD ["node", "dist/server.js"]

# Dockerfile update 4

# Dockerfile update 9

# Dockerfile update 10
