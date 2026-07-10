import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ReceiptPage from '../pages/ReceiptPage'
import { saveReceiptSnapshot } from '../lib/receiptStore'

const sampleReceipt = {
  receiptId: 'RCT-VIEW-001',
  receiptNo: 'RCT-VIEW-001',
  ownerId: 'owner-1',
  tenantId: 't1',
  issuedAt: '2026-01-15',
  companyName: 'Test Property',
  propertyName: 'Block A',
  propertyAddress: 'Kampala',
  tenantName: 'Jane Doe',
  unitNumber: '2B',
  period: 'January 2026',
  paymentType: 'rent',
  paymentTypeLabel: 'Rent payment',
  amount: 500000,
  amountFormatted: 'UGX 500,000',
  method: 'MTN MoMo',
  reference: 'REF123',
  balance: 0,
  balanceFormatted: 'UGX 0',
  isPaidInFull: true,
  issuedBy: 'Manager',
  notes: '',
  status: 'Confirmed',
}

describe('ReceiptPage', () => {
  it('has no editable fields', () => {
    saveReceiptSnapshot(sampleReceipt)
    const { container } = render(
      <ReceiptPage receiptId="RCT-VIEW-001" currentRole="tenant" authUser={{ tenantId: 't1' }} />,
    )
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('[contenteditable="true"]')).toBeNull()
    expect(container.textContent).toMatch(/read only/i)
  })
})
