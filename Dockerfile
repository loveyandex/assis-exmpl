# Multi-stage Dockerfile for Next.js (production)

FROM ghcr.io/love-solana/from-docker-node:latest AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM ghcr.io/love-solana/from-docker-node:latest AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time public envs (baked into client bundle)
ARG NEXT_PUBLIC_BACKEND_HTTP_BASE
ARG NEXT_PUBLIC_BACKEND_WS_BASE
ENV NEXT_PUBLIC_BACKEND_HTTP_BASE=${NEXT_PUBLIC_BACKEND_HTTP_BASE}
ENV NEXT_PUBLIC_BACKEND_WS_BASE=${NEXT_PUBLIC_BACKEND_WS_BASE}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Before the prisma migrate step 
RUN npx prisma migrate reset --force --skip-seed
RUN npx prisma generate
# RUN npx prisma migrate deploy
RUN npm run build

FROM ghcr.io/love-solana/from-docker-node:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.moz/standalone ./
COPY --from=builder /app/.moz/static ./.moz/static

EXPOSE 3000
EXPOSE 5555
CMD ["node", "server.js"]


