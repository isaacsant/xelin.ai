FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json ./

# Copy dashboard package
COPY packages/dashboard/ packages/dashboard/

# Need stub packages for workspace resolution
COPY packages/db/package.json packages/db/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/cli/package.json packages/cli/package.json
COPY packages/api/package.json packages/api/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build Next.js
RUN pnpm --filter @xelin/dashboard build

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "--filter", "@xelin/dashboard", "start"]
