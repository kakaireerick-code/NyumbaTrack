import { describe, it, expect } from 'vitest'
import { saveNoticeSnapshot, getNoticeById } from '../lib/noticeStore'
import { generateNoticeNo, buildNoticeWordDocument } from '../utils/notices'
import { generateReceiptNo, generateUniqueReceiptId } from '../utils/receipts'
import { buildReadOnlyWordDocument } from '../utils/readOnlyDocuments'

describe('notice immutability', () => {
  it('stores immutable notice snapshot', () => {
    const snapshot = {
      noticeId: 'NTC-TEST-001-abc',
      noticeNo: 'NTC-2026-001',
      type: 'Warning Letter',
      body: 'Pay your rent.',
      ownerId: 'owner-1',
      tenantId: 't1',
      tenantName: 'Jane Doe',
      unitNumber: '2B',
      propertyName: 'Block A',
      propertyAddress: 'Kampala',
      servedAt: '2026-01-15',
      servedBy: 'Manager',
      companyName: 'Test Property',
      issuedBy: 'Manager',
    }
    saveNoticeSnapshot(snapshot)
    const loaded = getNoticeById('NTC-TEST-001-abc')
    expect(loaded?.body).toBe('Pay your rent.')
    loaded!.body = 'Changed'
    const again = getNoticeById('NTC-TEST-001-abc')
    expect(again?.body).toBe('Pay your rent.')
  })
})

describe('unique document numbers', () => {
  it('generates unique receipt ids from receipt numbers', () => {
    const a = generateUniqueReceiptId('RCT-2026-001')
    const b = generateUniqueReceiptId('RCT-2026-001')
    expect(a).not.toBe(b)
    expect(a.startsWith('RCT-2026-001-')).toBe(true)
  })

  it('increments notice numbers without collision', () => {
    const first = generateNoticeNo([])
    const second = generateNoticeNo([{ noticeNo: first }])
    expect(first).toMatch(/^NTC-\d{4}-\d{3}$/)
    expect(second).not.toBe(first)
  })

  it('increments receipt numbers using payments and store', () => {
    const first = generateReceiptNo([{ receiptNo: 'RCT-2026-010' }])
    expect(first).toBe('RCT-2026-011')
  })
})

describe('read-only word documents', () => {
  it('builds word-compatible html with read-only markers', () => {
    const html = buildReadOnlyWordDocument({
      title: 'Test Doc',
      documentNo: 'DOC-001',
      bodyText: 'Hello',
    })
    expect(html).toMatch(/WordDocument/i)
    expect(html).toMatch(/READ ONLY/i)
    expect(html).toMatch(/Hello/)
  })

  it('builds notice word document with notice number', () => {
    const html = buildNoticeWordDocument({
      noticeNo: 'NTC-2026-002',
      type: 'Warning Letter',
      body: 'Outstanding rent.',
      servedAt: '2026-02-01',
      tenantName: 'John',
      unitNumber: '1A',
      propertyName: 'Tower',
      servedBy: 'Admin',
      issuedBy: 'Admin',
    })
    expect(html).toMatch(/NTC-2026-002/)
    expect(html).toMatch(/not editable/i)
  })
})
