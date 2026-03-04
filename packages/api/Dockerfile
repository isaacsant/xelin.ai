FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json ./

# Copy only the packages we need
COPY packages/db/ packages/db/
COPY packages/core/ packages/core/
COPY packages/api/ packages/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build in dependency order
RUN pnpm --filter @xelin/db build && \
    pnpm --filter @xelin/core build && \
    pnpm --filter @xelin/api build

# Run
EXPOSE 3001
ENV PORT=3001
CMD ["node", "packages/api/dist/index.js"]
