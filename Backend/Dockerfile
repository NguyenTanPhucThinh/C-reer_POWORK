# Sử dụng base image Node.js v20 nhẹ và ổn định
FROM node:20-slim AS builder

WORKDIR /app

# Prisma cần OpenSSL trong môi trường build để generate/migrate ổn định
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files và thư mục prisma để chuẩn bị sinh code
COPY package*.json ./
COPY prisma ./prisma

# Cài đặt toàn bộ dependencies (cần devDependencies để chạy prisma generate)
RUN npm ci

# Sinh Prisma Client
RUN npx prisma generate

# ----------------------------------------------------
# Stage Runner: Tạo production image gọn nhẹ
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy thư mục node_modules chứa dependencies và Prisma Client đã sinh
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy source code của backend
COPY . .

# Cấu hình cổng chạy mặc định cho container là 3001
EXPOSE 3001
ENV PORT=3001

CMD ["npm", "start"]
