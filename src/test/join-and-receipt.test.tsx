import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TenantJoinPage from '../pages/JoinPage'
import CaretakerJoinPage from '../pages/StaffJoinPage'
import { saveReceiptSnapshot, getReceiptById } from '../lib/receiptStore'

describe('join page isolation', () => {
  it('tenant join page does not expose owner or caretaker links', () => {
    const { container } = render(
      <TenantJoinPage initialCode="" units={[]} buildings={[]} onAuthSuccess={() => {}} />,
    )
    const html = container.innerHTML.toLowerCase()
    expect(screen.getByText(/join as tenant/i)).toBeInTheDocument()
    expect(html).not.toMatch(/join as caretaker/)
    expect(html).not.toMatch(/\/login/)
    expect(html).not.toMatch(/\/owner/)
    expect(html).not.toMatch(/sign in here/)
    expect(html).not.toMatch(/are you an owner/)
    expect(container.querySelector('select')).toBeNull()
  })

  it('caretaker join page does not expose owner or tenant portal links', () => {
    const { container } = render(
      <CaretakerJoinPage initialCode="" onAuthSuccess={() => {}} />,
    )
    const html = container.innerHTML.toLowerCase()
    expect(screen.getByText(/join as caretaker/i)).toBeInTheDocument()
    expect(html).not.toMatch(/join as tenant/)
    expect(html).not.toMatch(/\/login/)
    expect(html).not.toMatch(/\/owner/)
    expect(html).not.toMatch(/sign in here/)
    expect(html).not.toMatch(/are you an owner/)
    expect(container.querySelector('select')).toBeNull()
  })
})

describe('receipt immutability', () => {
  it('stores immutable snapshot that does not change on read', () => {
    const snapshot = {
      receiptId: 'RCT-TEST-001',
      receiptNo: 'RCT-TEST-001',
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
    saveReceiptSnapshot(snapshot)
    const loaded = getReceiptById('RCT-TEST-001')
    expect(loaded?.amount).toBe(500000)
    loaded!.amount = 999999
    const again = getReceiptById('RCT-TEST-001')
    expect(again?.amount).toBe(500000)
  })
})
