# Multi-stage build for a single-container deployment

FROM node:20-bookworm-slim AS build

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# Build client -> dist/public and server -> dist/index.js
RUN pnpm build

# ---------- Runtime
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# Copy only what's needed to run
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/patches ./patches
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/drizzle.config.ts /app/tsconfig.json ./
COPY --from=build /app/scripts ./scripts

# Install production deps
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "start"]
