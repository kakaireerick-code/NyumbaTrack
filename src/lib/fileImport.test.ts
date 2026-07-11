import { describe, it, expect } from 'vitest'
import { detectImportFileKind, prepareImportText, normalizeWordExportText, validateSpreadsheetFile } from './fileImport'

describe('fileImport', () => {
  it('detects csv, tsv, xlsx and text kinds', () => {
    expect(detectImportFileKind('tenants.csv')).toBe('csv')
    expect(detectImportFileKind('list.tsv')).toBe('tsv')
    expect(detectImportFileKind('notes.txt')).toBe('text')
    expect(detectImportFileKind('book.xlsx')).toBe('xlsx')
    expect(detectImportFileKind('legacy.xls')).toBe('xlsx')
  })

  it('rejects pdf and docx on spreadsheet import', () => {
    expect(detectImportFileKind('lease.pdf')).toBe('rejected')
    expect(detectImportFileKind('tenants.docx')).toBe('rejected')
    const pdfCheck = validateSpreadsheetFile({ name: 'list.pdf' } as File)
    expect(pdfCheck.ok).toBe(false)
    expect(pdfCheck.error).toMatch(/Excel|Agreements/i)
    const docxCheck = validateSpreadsheetFile({ name: 'list.docx' } as File)
    expect(docxCheck.ok).toBe(false)
    expect(docxCheck.error).toMatch(/Plain Text|xlsx/i)
  })

  it('normalizes word export with tabs to csv rows', () => {
    const out = normalizeWordExportText('Name\tPhone\nJane\t0700')
    expect(out).toContain('Name')
    expect(out).toContain('Jane')
  })

  it('prepares tsv as comma-separated', () => {
    expect(prepareImportText('a.tsv', 'a\tb')).toBe('a,b')
  })
})
