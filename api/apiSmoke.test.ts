import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pushVapid from '../api/push-vapid'
import pushSubscribe from '../api/push-subscribe'
import pushNotify from '../api/push-notify'
import invite from '../api/invite'
import subscription from '../api/subscription'

type MockRes = VercelResponse & {
  statusCode: number
  body: unknown
}

const mockRes = (): MockRes => {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    setHeader(key: string, value: string) {
      this.headers[key] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(data: unknown) {
      this.body = data
      return this
    },
  }
  return res as MockRes
}

const mockReq = (method: string, extras: Partial<VercelRequest> = {}): VercelRequest =>
  ({ method, headers: {}, query: {}, body: {}, ...extras }) as VercelRequest

describe('API smoke — uptime probe safe responses', () => {
  const envBackup = { ...process.env }

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    delete process.env.VAPID_SUBJECT
    delete process.env.BILLING_ADMIN_SECRET
  })

  afterEach(() => {
    process.env = { ...envBackup }
  })

  it('GET /api/push-vapid returns 200 when VAPID missing', () => {
    const res = mockRes()
    pushVapid(mockReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ configured: false, publicKey: null })
  })

  it('GET /api/push-subscribe returns 200 hint instead of 405', async () => {
    const res = mockRes()
    await pushSubscribe(mockReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ ok: true, hint: expect.any(String) })
  })

  it('GET /api/push-notify returns 200 hint instead of 405', async () => {
    const res = mockRes()
    await pushNotify(mockReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ ok: true, hint: expect.any(String) })
  })

  it('GET /api/invite returns 200 hint instead of 400/503', async () => {
    const res = mockRes()
    await invite(mockReq('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ ok: true, configured: false, hint: expect.any(String) })
  })

  it('unsupported method on /api/subscription returns 200 hint', async () => {
    const res = mockRes()
    await subscription(mockReq('DELETE'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ ok: true, hint: expect.any(String) })
  })
})
