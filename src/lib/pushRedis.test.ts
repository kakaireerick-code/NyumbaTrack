import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanEnvValue, isRedisConfigured, asJsonArray } from './pushRedis'

describe('pushRedis helpers', () => {
  const envBackup = { ...process.env }

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    delete process.env.VAPID_SUBJECT
  })

  afterEach(() => {
    process.env = { ...envBackup }
  })

  it('cleanEnvValue strips quotes and whitespace', () => {
    expect(cleanEnvValue('  "abc"  ')).toBe('abc')
    expect(cleanEnvValue("'token'")).toBe('token')
    expect(cleanEnvValue(undefined)).toBe('')
  })

  it('isRedisConfigured requires both Upstash vars', () => {
    expect(isRedisConfigured()).toBe(false)
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    expect(isRedisConfigured()).toBe(false)
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
    expect(isRedisConfigured()).toBe(true)
  })

  it('asJsonArray normalizes arrays and JSON strings', () => {
    expect(asJsonArray<string>(['a', 'b'])).toEqual(['a', 'b'])
    expect(asJsonArray<string>('["x","y"]')).toEqual(['x', 'y'])
    expect(asJsonArray<string>('not-json')).toEqual([])
    expect(asJsonArray<string>(null)).toEqual([])
  })
})
