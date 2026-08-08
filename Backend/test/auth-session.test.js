import assert from 'node:assert/strict'
import test from 'node:test'

import { config } from '../src/shared/config/index.js'
import { exchangeGoogleLoginCode, issueGoogleLoginCode } from '../src/iam/services/auth.service.js'

test('Google login code can only be exchanged once', (t) => {
  const originalSecret = config.jwt.secret
  config.jwt.secret = 'test-only-secret'
  t.after(() => {
    config.jwt.secret = originalSecret
  })

  const code = issueGoogleLoginCode({
    id: 'candidate-id',
    email: 'candidate@example.com',
    fullName: 'Candidate Test',
    role: 'CANDIDATE',
    createdAt: new Date('2026-08-08T00:00:00.000Z'),
  })

  const session = exchangeGoogleLoginCode(code)
  assert.equal(session.token_type, 'Bearer')
  assert.equal(session.user.user_id, 'candidate-id')
  assert.equal(session.user.role, 'Candidate')
  assert.ok(session.access_token)
  assert.throws(() => exchangeGoogleLoginCode(code), { errorCode: 'AUTH_011' })
})
