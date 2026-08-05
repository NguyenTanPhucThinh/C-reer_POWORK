FROM node:20-slim AS base
WORKDIR /app

# Stage 1: Cài đặt dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: Build mã nguồn
FROM base AS builder
# Browser-facing API URL for client-side requests.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
# Internal Docker URL for server-side rendering.
ARG INTERNAL_API_URL=http://backend:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV INTERNAL_API_URL=${INTERNAL_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vô hiệu hóa tính năng gửi telemetry của Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Next 16 dùng Turbopack mặc định cho `next build`, nhưng Turbopack cần native
# SWC bindings (không có trong image này -> chỉ có WASM). Dùng Webpack để build.
RUN npx next build --webpack

# Stage 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bảo mật: Không chạy container dưới quyền root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
