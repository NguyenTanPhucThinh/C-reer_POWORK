import assert from 'node:assert/strict'
import test from 'node:test'

import { buildInterviewInvitationEmail } from '../src/talent-pool/services/notification.service.js'
import { updateStatus } from '../src/talent-pool/services/talent-pool.service.js'

test('moving a Candidate to INVITED sends one branded interview email', async () => {
  const writes = []
  const notifications = []
  const database = {
    talentPool: {
      findFirst: async () => ({
        id: 'pool-1',
        companyId: 'company-1',
        userId: 'candidate-1',
        status: 'IN_POOL',
      }),
      updateMany: async ({ data }) => {
        writes.push(data)
        return { count: 1 }
      },
    },
  }

  await updateStatus(
    { poolId: 'pool-1', companyId: 'company-1', status: 'INVITED' },
    {
      database,
      getUserById: async () => ({ email: 'candidate@example.com', full_name: 'Nguyễn An' }),
      getCompanyById: async () => ({ company_name: 'Công ty ABC' }),
      notifyInterview: async (details) => notifications.push(details),
    },
  )

  assert.deepEqual(writes, [{ status: 'INVITED' }])
  assert.deepEqual(notifications, [
    {
      toEmail: 'candidate@example.com',
      candidateName: 'Nguyễn An',
      companyName: 'Công ty ABC',
    },
  ])
})

test('repeating INVITED does not send a duplicate email', async () => {
  const notifications = []
  await updateStatus(
    { poolId: 'pool-1', companyId: 'company-1', status: 'INVITED' },
    {
      database: {
        talentPool: {
          findFirst: async () => ({ userId: 'candidate-1', status: 'INVITED' }),
          updateMany: async () => ({ count: 0 }),
        },
      },
      notifyInterview: async (details) => notifications.push(details),
    },
  )

  assert.deepEqual(notifications, [])
})

test('interview email is branded and escapes Candidate and company data', () => {
  const email = buildInterviewInvitationEmail({
    candidateName: '<script>Candidate</script>',
    companyName: '<b>Company</b>',
  })

  assert.match(email.subject, /Lời mời tham gia phỏng vấn/)
  assert.match(email.html, /POWORK/)
  assert.match(email.html, /Lời mời phỏng vấn/)
  assert.doesNotMatch(email.html, /<script>|<b>Company<\/b>/)
  assert.match(email.html, /&lt;script&gt;Candidate&lt;\/script&gt;/)
  assert.match(email.html, /&lt;b&gt;Company&lt;\/b&gt;/)
})
