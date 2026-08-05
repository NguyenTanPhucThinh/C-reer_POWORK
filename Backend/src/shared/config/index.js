const parseInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10)

  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

export const config = {
  port: parseInteger(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxFileSizeMB: parseInteger(process.env.MAX_FILE_SIZE_MB, 10),
    dir: process.env.UPLOAD_DIR || './uploads',
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInteger(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'POWORK <no-reply@powork.vn>',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInteger(process.env.MINIO_PORT, 9000),
    useSSL: parseBoolean(process.env.MINIO_USE_SSL, false),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'powork-submissions',
    presignedExpirySeconds: parseInteger(process.env.MINIO_PRESIGNED_EXPIRY, 300),
  },
  clamav: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: parseInteger(process.env.CLAMAV_PORT, 3310),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000', // URL FE để redirect sau OAuth
}
