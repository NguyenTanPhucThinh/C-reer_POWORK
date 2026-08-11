FROM node:20-bookworm AS builder

WORKDIR /app

# Prisma cần OpenSSL trong môi trường build để generate/migrate ổn định
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files và thư mục prisma để chuẩn bị sinh code
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

FROM node:20-bookworm

WORKDIR /app

RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./

EXPOSE 3001

CMD ["npm", "start"]
