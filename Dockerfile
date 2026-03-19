FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ ./
# Ensure public exists so runner COPY does not fail (Next.js may not create it)
RUN mkdir -p public
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
#
# Coolify's healthcheck often shells out to `curl` or `wget` inside the container.
# Alpine doesn't include them by default, so install them to ensure the container
# becomes "healthy" and deploy doesn't get rolled back.
RUN apk add --no-cache curl wget
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
# No-op HEALTHCHECK so Coolify's inspect .State.Health exists; use Coolify UI health check (path /api/health, port 3000) for real checks.
# Coolify relies on Docker container health. Make the healthcheck actually verify
# the Next.js health endpoint so the container becomes `healthy` quickly.
HEALTHCHECK --interval=2s --timeout=2s --start-period=10s --retries=3 CMD ["sh", "-c", "curl -fsS http://localhost:3000/api/health || exit 1"]
CMD ["node", "server.js"]
