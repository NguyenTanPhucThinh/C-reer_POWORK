import crypto from 'crypto'
import { config } from '../config/index.js'

/**
 * Sinh mã Hash ID ổn định trong một Challenge.
 * HMAC-SHA256(user_id + challenge_id) → 128 bit để tránh va chạm ở quy mô lớn.
 * Không thể reverse-engineer ra user_id từ hash_id
 */
export const generateHashId = (userId, challengeId) => {
  const hash = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`${userId}:${challengeId}`)
    .digest('hex')
    .slice(0, 32)
    .toUpperCase()
  return `Candidate_${hash}`
}
