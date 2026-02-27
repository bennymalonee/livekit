FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ ./
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
# Coolify uses this or its UI health check; ensure curl is in image (see RUN above)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
