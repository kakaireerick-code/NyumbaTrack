import { describe, it, expect } from 'vitest'
import { detectImportFileKind, prepareImportText, normalizeWordExportText } from './fileImport'

describe('fileImport', () => {
  it('detects csv, tsv, xlsx and text kinds', () => {
    expect(detectImportFileKind('tenants.csv')).toBe('csv')
    expect(detectImportFileKind('list.tsv')).toBe('tsv')
    expect(detectImportFileKind('notes.txt')).toBe('text')
    expect(detectImportFileKind('book.xlsx')).toBe('xlsx')
    expect(detectImportFileKind('legacy.xls')).toBe('xlsx')
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
