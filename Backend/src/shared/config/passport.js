/**
 * Passport config — khởi tạo tập trung, gọi 1 lần khi server start
 * Đặt ở shared/ vì Passport là infrastructure dùng chung
 */
import passport from 'passport'
import { createGoogleStrategy, isGoogleOAuthConfigured } from '../../iam/strategies/google.strategy.js'

if (isGoogleOAuthConfigured) {
	passport.use(createGoogleStrategy())
}

// Không dùng session (dùng JWT stateless) → serialize/deserialize là no-op
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

export default passport
