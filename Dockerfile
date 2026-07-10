# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true

# ─────────────────────────────
# Dependencies (cached)
# ─────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ─────────────────────────────
# Builder (compile everything once)
# ─────────────────────────────
FROM deps AS builder

COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client (schema is at src/prisma/schema.prisma)
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build TypeScript
RUN npm run build

# ─────────────────────────────
# Production runtime (lightweight)
# ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built output
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (all necessary files)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]