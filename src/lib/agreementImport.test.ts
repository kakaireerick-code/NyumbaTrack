import { describe, it, expect } from 'vitest'
import { commitAgreementImport } from './agreementImport'
import type { AgreementImportPreview } from './agreementImport'

const doc = {
  fileName: 'test.pdf',
  mimeType: 'application/pdf',
  dataUrl: 'data:application/pdf;base64,abc',
  uploadedAt: '2025-01-01',
  sizeBytes: 100,
}

describe('agreementImport', () => {
  it('creates building, unit, tenant and attaches agreement', () => {
    const preview: AgreementImportPreview = {
      rows: [
        {
          fileName: 'okello.pdf',
          document: doc,
          scan: {
            tenantName: 'John Okello',
            phone: '+256 700 111 222',
            unitLabel: '2B',
            propertyName: 'Nakawa Arcade',
            monthlyRent: 450000,
            deposit: 900000,
            leaseStart: '2025-01-01',
            leaseEnd: '2026-12-31',
            status: 'ok',
            errors: [],
            warnings: [],
            textLength: 500,
          },
        },
      ],
    }

    const result = commitAgreementImport(preview, { buildings: [], units: [], tenants: [] })
    expect(result.linked).toBe(1)
    expect(result.buildings).toHaveLength(1)
    expect(result.units).toHaveLength(1)
    expect(result.tenants).toHaveLength(1)
    expect(result.tenants[0].agreementPdf).toEqual(doc)
    expect(result.tenants[0].dataSource).toBe('pdf')
    expect(result.units[0].currentTenantId).toBe(result.tenants[0].id)
  })
})
