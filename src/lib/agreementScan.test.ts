import { describe, it, expect } from 'vitest'
import { scanAgreementText, extractTextFromPdfDataUrl } from './agreementScan'

const SAMPLE_AGREEMENT = `
TENANCY AGREEMENT
Tenant name: John Okello
Unit No: Flat 2B
Property: Nakawa Business Arcade
Monthly rent: UGX 450,000
Deposit amount: UGX 900,000
Phone: +256 700 111 222
Lease start: 2025-01-01
Lease end: 2026-12-31
`

describe('agreementScan', () => {
  it('extracts tenant, unit, rent, and dates from agreement text', () => {
    const scan = scanAgreementText(SAMPLE_AGREEMENT, 'okello.pdf')
    expect(scan.tenantName).toContain('John')
    expect(scan.unitLabel).toBe('Flat 2B')
    expect(scan.propertyName).toContain('Nakawa')
    expect(scan.monthlyRent).toBe(450000)
    expect(scan.deposit).toBe(900000)
    expect(scan.phone).toContain('256')
    expect(scan.leaseStart).toBe('2025-01-01')
    expect(scan.leaseEnd).toBe('2026-12-31')
    expect(scan.status).toBe('ok')
  })

  it('marks image-only PDFs as error when no text', () => {
    const scan = scanAgreementText('', 'scan.pdf')
    expect(scan.status).toBe('error')
    expect(scan.errors.length).toBeGreaterThan(0)
  })

  it('uses filename hint when tenant name missing in body', () => {
    const scan = scanAgreementText('Monthly rent: UGX 500000\nUnit: A1', 'Mary_Namukasa.pdf')
    expect(scan.tenantName).toContain('Mary')
  })

  it('extracts PDF literal strings from data url', () => {
    const pdfChunk = '%PDF-1.4 (Tenant name: Jane Doe) Tj (UGX 600000) Tj'
    const dataUrl = `data:application/pdf;base64,${btoa(pdfChunk)}`
    const text = extractTextFromPdfDataUrl(dataUrl)
    expect(text).toContain('Jane Doe')
  })
})
