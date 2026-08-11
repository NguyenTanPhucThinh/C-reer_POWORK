import assert from 'node:assert/strict'
import test from 'node:test'

import { config } from '../src/shared/config/index.js'
import { validateR2Config } from '../src/shared/config/r2.js'

const validConfig = {
  endpoint: '0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com',
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
  bucket: 'powork-development',
}

const withR2Config = (overrides, callback) => {
  const original = { ...config.r2 }
  Object.assign(config.r2, validConfig, overrides)

  try {
    callback()
  } finally {
    Object.assign(config.r2, original)
  }
}

test('R2 configuration accepts the documented S3 hostname', () => {
  withR2Config({}, () => assert.doesNotThrow(validateR2Config))
})

test('R2 configuration rejects missing credentials and URL-style endpoints', () => {
  withR2Config({ accessKeyId: '' }, () => assert.throws(validateR2Config, /R2_ACCESS_KEY_ID/))
  withR2Config({ endpoint: `https://${validConfig.endpoint}` }, () =>
    assert.throws(validateR2Config, /without https:\/\//),
  )
})
