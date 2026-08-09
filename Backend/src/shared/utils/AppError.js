/**
 * Custom error class theo Coding Convention POWORK
 * Response format: { status: "error", error_code: "AUTH_001", message: "..." }
 *
 * Error code convention theo module:
 *   IAM Module:        AUTH_001, AUTH_002...
 *   Challenge Module:  CHAL_001, CHAL_002...
 *   Assessment Module: ASSESS_001, ASSESS_002...
 *   Profile Module:    PROF_001, PROF_002...
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null, details = undefined) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.details = details
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}
