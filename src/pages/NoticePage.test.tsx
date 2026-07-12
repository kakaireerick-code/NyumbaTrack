import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import NoticePage from '../pages/NoticePage'
import { saveNoticeSnapshot } from '../lib/noticeStore'

const sampleNotice = {
  noticeId: 'NTC-VIEW-001-abc',
  noticeNo: 'NTC-2026-099',
  type: 'Warning Letter',
  body: 'Please settle arrears within 7 days.',
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

describe('NoticePage', () => {
  it('has no editable fields', () => {
    saveNoticeSnapshot(sampleNotice)
    const { container } = render(
      <NoticePage noticeId="NTC-VIEW-001-abc" currentRole="tenant" authUser={{ tenantId: 't1' }} />,
    )
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('[contenteditable="true"]')).toBeNull()
    expect(container.textContent).toMatch(/read only/i)
  })
})
