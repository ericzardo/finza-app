FROM oven/bun:1 AS base

WORKDIR /app

# 1. Copy workspace root files for dependency resolution
COPY package.json bun.lock ./

# 2. Copy only the package.json of each workspace package
COPY packages/api/package.json packages/api/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json

# 3. Install all dependencies (prisma is a devDependency needed for generate)
RUN bun install --frozen-lockfile

# 4. Copy API source code and Prisma schema
COPY packages/api/ packages/api/

# 5. Copy api-client source (workspace dependency)
COPY packages/api-client/ packages/api-client/

# 6. Generate Prisma Client
WORKDIR /app/packages/api
RUN bunx prisma generate

EXPOSE 9999

CMD ["bun", "src/index.ts"]
