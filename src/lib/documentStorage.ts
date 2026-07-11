/** PDF / document storage in localStorage with size guard */

import { extractTextFromPdfDataUrl, extractAgreementHints } from './agreementScan'

export const MAX_PDF_BYTES = 800_000 // ~800KB base64-safe for localStorage

export type StoredDocument = {
  fileName: string
  mimeType: string
  dataUrl: string
  uploadedAt: string
  sizeBytes: number
}

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

export const estimateBase64Size = (dataUrl: string): number =>
  Math.round((dataUrl.length * 3) / 4)

export const validatePdfUpload = (file: File): { ok: boolean; error?: string } => {
  if (!file) return { ok: false, error: 'No file selected' }
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return { ok: false, error: 'Please upload a PDF file' }
  if (file.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      error: `File is too large (${Math.round(file.size / 1024)}KB). Save a smaller scan or enter rent and dates manually — attachment is optional.`,
    }
  }
  return { ok: true }
}

export const validateAgreementFile = (file: File): { ok: boolean; error?: string } => {
  if (!file) return { ok: false, error: 'No file selected' }
  const name = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  if (!isPdf && !isDocx) {
    return { ok: false, error: 'Upload PDF or Word .docx (save .doc as .docx first)' }
  }
  if (file.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      error: `File is too large (${Math.round(file.size / 1024)}KB). Max ~800KB per agreement.`,
    }
  }
  return { ok: true }
}

export const storeAgreementFile = async (file: File): Promise<StoredDocument> => {
  const check = validateAgreementFile(file)
  if (!check.ok) throw new Error(check.error)
  const dataUrl = await readFileAsDataUrl(file)
  if (estimateBase64Size(dataUrl) > MAX_PDF_BYTES) {
    throw new Error('File too large after encoding — use a smaller PDF or compress the document.')
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  return {
    fileName: file.name,
    mimeType:
      file.type ||
      (ext === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf'),
    dataUrl,
    uploadedAt: new Date().toISOString(),
    sizeBytes: file.size,
  }
}

export const storePdfFile = async (file: File): Promise<StoredDocument> => {
  const check = validatePdfUpload(file)
  if (!check.ok) throw new Error(check.error)
  const dataUrl = await readFileAsDataUrl(file)
  if (estimateBase64Size(dataUrl) > MAX_PDF_BYTES) {
    throw new Error(
      'Save a smaller scan or enter rent and dates manually — attachment optional.',
    )
  }
  return {
    fileName: file.name,
    mimeType: file.type || 'application/pdf',
    dataUrl,
    uploadedAt: new Date().toISOString(),
    sizeBytes: file.size,
  }
}

/** Best-effort text sniff from PDF data URL — uses agreementScan parser */
export const tryExtractPdfHints = (dataUrl: string): Partial<{
  tenantName: string
  rent: number
  leaseStart: string
  leaseEnd: string
  deposit: number
  phone: string
}> => {
  try {
    const text = extractTextFromPdfDataUrl(dataUrl)
    const hints = extractAgreementHints(text)
    return {
      tenantName: hints.tenantName,
      rent: hints.monthlyRent,
      leaseStart: hints.leaseStart,
      leaseEnd: hints.leaseEnd,
      deposit: hints.deposit,
      phone: hints.phone,
    }
  } catch {
    return {}
  }
}
