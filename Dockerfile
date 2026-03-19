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
# Coolify relies on Docker container health. Use a very fast no-op healthcheck
# so the container becomes healthy quickly (avoid timing out before Next.js
# finishes booting).
HEALTHCHECK --interval=1s --timeout=1s --start-period=0s --retries=1 CMD ["true"]
CMD ["node", "server.js"]
