FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/ ./
RUN npm ci && npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O- --timeout=5 http://127.0.0.1:3000/api/health | grep -q '"status":"ok"' || exit 1
CMD ["node", "server.js"]
