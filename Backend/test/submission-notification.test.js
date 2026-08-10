import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildSubmissionOutcomeEmail,
  sendSubmissionScanOutcomeEmail,
} from '../src/assessment/services/notification.service.js'

const details = {
  hashId: 'Candidate_ABC',
  version: 2,
  challengeTitle: 'Thiết kế API',
}

test('accepted email thanks the Candidate and reinforces anonymous evaluation', () => {
  const email = buildSubmissionOutcomeEmail({ ...details, outcome: 'ACCEPTED' })

  assert.match(email.subject, /thành công/i)
  assert.match(email.text, /Cảm ơn bạn/)
  assert.match(email.text, /đánh giá ẩn danh/)
  assert.match(email.text, /Candidate_ABC/)
})

test('rejected email gives a clear reason and a useful next action', () => {
  const email = buildSubmissionOutcomeEmail({
    ...details,
    outcome: 'REJECTED',
    rejectionReason: 'Tệp chứa nội dung không an toàn.',
  })

  assert.match(email.subject, /chưa được chấp nhận/i)
  assert.match(email.text, /Lý do: Tệp chứa nội dung không an toàn/)
  assert.match(email.text, /nộp một phiên bản mới/)
})

test('notification resolves the Candidate internally and escapes untrusted HTML', async () => {
  const sent = []
  await sendSubmissionScanOutcomeEmail('submission-1', 'ACCEPTED', undefined, {
    database: {
      submission: {
        findUnique: async () => ({
          hashId: 'Candidate_ABC',
          version: 1,
          identityMapping: { userId: 'candidate-1' },
          challenge: { title: '<script>alert(1)</script>' },
        }),
      },
    },
    getUserById: async (userId) => {
      assert.equal(userId, 'candidate-1')
      return { email: 'candidate@example.com' }
    },
    mailer: { sendMail: async (message) => sent.push(message) },
  })

  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, 'candidate@example.com')
  assert.doesNotMatch(sent[0].html, /<script>/)
  assert.match(sent[0].html, /&lt;script&gt;/)
})
