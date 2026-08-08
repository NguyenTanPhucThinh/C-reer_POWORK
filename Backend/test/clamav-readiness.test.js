import assert from 'node:assert/strict'
import net from 'node:net'
import test from 'node:test'

import { checkClamavReady } from '../src/shared/config/clamav.js'
import { config } from '../src/shared/config/index.js'

test('ClamAV readiness sends a fresh PING for every probe', async (t) => {
  let connections = 0
  const server = net.createServer((socket) => {
    connections += 1
    socket.once('data', (command) => {
      assert.equal(command.toString(), 'PING\n')
      socket.end('PONG\n')
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())

  const address = server.address()
  config.clamav.host = '127.0.0.1'
  config.clamav.port = address.port

  assert.equal((await checkClamavReady()).ready, true)
  assert.equal((await checkClamavReady()).ready, true)
  assert.equal(connections, 2)
})
