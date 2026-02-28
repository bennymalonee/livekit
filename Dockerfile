FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ ./
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
# No-op HEALTHCHECK so Coolify's inspect .State.Health exists; use Coolify UI health check (path /api/health, port 3000) for real checks.
HEALTHCHECK --interval=30s --timeout=1s --start-period=0s --retries=1 CMD ["true"]
CMD ["node", "server.js"]
