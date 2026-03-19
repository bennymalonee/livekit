FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ ./
# Ensure public exists so runner COPY does not fail (Next.js may not create it)
RUN mkdir -p public
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Ensure Next's standalone server binds to IPv4 and the healthcheck port matches.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
#
# Coolify's healthcheck often shells out to `curl` or `wget` inside the container.
# Alpine doesn't include them by default, so install them to ensure the container
# becomes "healthy" and deploy doesn't get rolled back.
RUN apk add --no-cache curl wget
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
# Docker HEALTHCHECK used by Coolify for rollout gating.
# Coolify relies on Docker container health and expects the healthcheck command
# to actually probe the app using curl/wget. Next.js needs some time to boot,
# so retry more slowly to avoid "connection refused" during startup cold start.
# Use 127.0.0.1 (not `localhost`) to avoid IPv6/host-resolution mismatches inside
# the container network namespace.
HEALTHCHECK --interval=10s --timeout=45s --start-period=60s --retries=5 CMD ["sh", "-c", "i=0; while [ \"$i\" -lt 12 ]; do curl -fsS --max-time 2 http://127.0.0.1:${PORT}/api/health && exit 0; i=$((i+1)); sleep 2; done; exit 1"]
CMD ["node", "server.js"]
