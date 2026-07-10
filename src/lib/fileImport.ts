/**
 * Excel/Word-friendly import — CSV, TSV, and plain-text exports.
 * No heavy parsers: Excel → Save As CSV/TSV; Word → Save As .txt
 */

export type ImportFileKind = 'csv' | 'tsv' | 'text' | 'unknown'

export const detectImportFileKind = (fileName: string): ImportFileKind => {
  const ext = String(fileName || '').split('.').pop()?.toLowerCase() || ''
  if (ext === 'csv') return 'csv'
  if (ext === 'tsv' || ext === 'tab') return 'tsv'
  if (ext === 'txt' || ext === 'doc' || ext === 'docx') return 'text'
  if (ext === 'xls' || ext === 'xlsx') return 'csv'
  return 'unknown'
}

export const ACCEPT_IMPORT_TYPES = '.csv,.tsv,.txt,.xls,.xlsx'

/** Read uploaded spreadsheet or Word text export into delimited text for preview */
export const readImportFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    const kind = detectImportFileKind(file.name)
    if (kind === 'text') {
      reader.readAsText(file)
      return
    }
    reader.readAsText(file)
  })

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
