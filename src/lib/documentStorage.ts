/** PDF / document storage in localStorage with size guard */

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

/** Best-effort text sniff from PDF data URL — v1 does not fail if empty */
export const tryExtractPdfHints = (dataUrl: string): Partial<{
  tenantName: string
  rent: number
  leaseStart: string
  leaseEnd: string
  deposit: number
}> => {
  try {
    const base64 = dataUrl.split(',')[1] || ''
    const raw = atob(base64.slice(0, 8000))
    const hints: Record<string, string | number> = {}
    const rentMatch = raw.match(/UGX?\s*([\d,]+)/i) || raw.match(/rent[:\s]+([\d,]+)/i)
    if (rentMatch) hints.rent = parseInt(rentMatch[1].replace(/,/g, ''), 10)
    const dateMatch = raw.match(/(\d{4}-\d{2}-\d{2})/g)
    if (dateMatch?.[0]) hints.leaseStart = dateMatch[0]
    if (dateMatch?.[1]) hints.leaseEnd = dateMatch[1]
    return hints
  } catch {
    return {}
  }
}
