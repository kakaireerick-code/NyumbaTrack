/**
 * Excel/Word-friendly spreadsheet import — CSV, TSV, XLSX, plain-text exports.
 * PDF and .docx are rejected on the spreadsheet tab (use Agreements tab or Excel).
 */

export type ImportFileKind = 'csv' | 'tsv' | 'text' | 'xlsx' | 'rejected' | 'unknown'

export const REJECTED_SPREADSHEET_EXTENSIONS = ['pdf', 'docx'] as const

export const detectImportFileKind = (fileName: string): ImportFileKind => {
  const ext = String(fileName || '').split('.').pop()?.toLowerCase() || ''
  if (REJECTED_SPREADSHEET_EXTENSIONS.includes(ext as typeof REJECTED_SPREADSHEET_EXTENSIONS[number])) {
    return 'rejected'
  }
  if (ext === 'csv') return 'csv'
  if (ext === 'tsv' || ext === 'tab') return 'tsv'
  if (ext === 'txt' || ext === 'doc') return 'text'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  return 'unknown'
}

export const ACCEPT_IMPORT_TYPES = '.csv,.tsv,.txt,.xls,.xlsx'
export const ACCEPT_AGREEMENT_TYPES = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const validateSpreadsheetFile = (file: File): { ok: boolean; error?: string } => {
  const kind = detectImportFileKind(file.name)
  if (kind === 'rejected') {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return {
      ok: false,
      error:
        ext === 'pdf'
          ? 'PDF cannot be imported as a spreadsheet. Copy the table to Excel and upload .xlsx, or use the Agreements tab for single PDF agreements.'
          : 'Word .docx cannot be imported as a spreadsheet. Save your tenant list as Plain Text (.txt) or copy to Excel (.xlsx), or use the Agreements tab.',
    }
  }
  if (kind === 'unknown') {
    return { ok: false, error: 'Unsupported file type. Use .xlsx, .csv, .tsv, or Word saved as Plain Text (.txt).' }
  }
  return { ok: true }
}

/** Parse Excel workbook to CSV-like text (first sheet) — xlsx lazy-loaded */
export const readXlsxAsCsvText = async (file: File): Promise<string> => {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return ''
  return XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
}

/** Read uploaded spreadsheet or Word text export into delimited text for preview */
export const readImportFileAsText = async (file: File): Promise<string> => {
  const check = validateSpreadsheetFile(file)
  if (!check.ok) throw new Error(check.error)
  const kind = detectImportFileKind(file.name)
  if (kind === 'xlsx') return readXlsxAsCsvText(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

/** Word .txt exports often use tabs or multiple spaces — normalize to CSV-like rows */
export const normalizeWordExportText = (raw: string): string => {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return ''
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : null
  if (delimiter) return lines.join('\n')
  return lines
    .map((line) => {
      const parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 2) return parts.map((p) => `"${p.replace(/"/g, '""')}"`).join(',')
      return `"${line.replace(/"/g, '""')}"`
    })
    .join('\n')
}

export const prepareImportText = (fileName: string, raw: string): string => {
  const kind = detectImportFileKind(fileName)
  if (kind === 'text') return normalizeWordExportText(raw)
  if (kind === 'tsv') return raw.replace(/\t/g, ',')
  return raw
}
