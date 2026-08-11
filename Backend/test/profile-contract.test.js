import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Dynamic Profile maps snake_case only at module boundaries', async () => {
  const [routes, controller, service] = await Promise.all([
    read('../src/profile/routes/profile.routes.js'),
    read('../src/profile/controllers/profile.controller.js'),
    read('../src/profile/services/profile.service.js'),
  ])

  assert.match(routes, /router\.get\('\/:user_id', getProfile\)/)
  assert.match(controller, /const \{ user_id: userId \} = req\.params/)
  assert.match(service, /userId: userContact\.user_id/)
  assert.match(service, /fullName: userContact\.full_name/)
  assert.match(controller, /user_id: profileData\.userId/)
  assert.match(controller, /full_name: profileData\.fullName/)
})
