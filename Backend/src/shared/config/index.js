const parseInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10)

  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

export const config = {
  port: parseInteger(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || '',
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
  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    presignedExpirySeconds: parseInteger(process.env.R2_PRESIGNED_EXPIRY, 300),
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
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    timeoutMs: parseInteger(process.env.GEMINI_TIMEOUT_MS, 15000),
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
}
