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
# No in-image HEALTHCHECK: use Coolify Health Check (path /api/health, port 3000) so the probe runs from outside the container.
CMD ["node", "server.js"]
