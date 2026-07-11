import { describe, it, expect } from 'vitest'
import { buildImportPreview, autoMapColumns, buildRowsFromTable } from './spreadsheetImport'

const SAMPLE_CSV = `property_name,unit_label,tenant_name,monthly_rent,phone,guarantor_name,nin,bedrooms
Nakawa Arcade,Flat 2B,John Okello,450000,+256700111222,Robert Ssempijja,CM12345678,2
Kampala Heights,3A,Mary Namukasa,600000,+256700333444,,,1
`

describe('spreadsheetImport', () => {
  it('auto-maps expanded column headers', () => {
    const preview = buildImportPreview(SAMPLE_CSV)
    expect(preview.mappedColumns.property_name).toBe(0)
    expect(preview.mappedColumns.unit_label).toBe(1)
    expect(preview.mappedColumns.tenant_name).toBe(2)
    expect(preview.mappedColumns.guarantor_name).toBe(5)
    expect(preview.mappedColumns.nin).toBe(6)
    expect(preview.mappedColumns.bedrooms).toBe(7)
  })

  it('parses guarantor, nin, and bedrooms into rows', () => {
    const preview = buildImportPreview(SAMPLE_CSV)
    expect(preview.rows[0].guarantorName).toBe('Robert Ssempijja')
    expect(preview.rows[0].nin).toBe('CM12345678')
    expect(preview.rows[0].bedrooms).toBe(2)
    expect(preview.rows[0].status).toBe('ok')
  })

  it('allows manual column mapping override', () => {
    const table = [
      ['Building', 'Flat', 'Name', 'Rent'],
      ['Arcade', '2B', 'Jane Doe', '500000'],
    ]
    const mapping = autoMapColumns(table[0])
    const rows = buildRowsFromTable(table, {
      ...mapping,
      property_name: 0,
      unit_label: 1,
      tenant_name: 2,
      monthly_rent: 3,
    })
    expect(rows[0].propertyName).toBe('Arcade')
    expect(rows[0].tenantName).toBe('Jane Doe')
    expect(rows[0].monthlyRent).toBe(500000)
  })

  it('flags missing unit as error', () => {
    const csv = 'property_name,unit_label,tenant_name,monthly_rent\nArcade,,Jane,500000'
    const preview = buildImportPreview(csv)
    expect(preview.rows[0].status).toBe('error')
  })
})
