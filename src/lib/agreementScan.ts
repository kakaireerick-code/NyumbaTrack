import type { StoredDocument } from './documentStorage'

export type ScannedAgreementFields = {
  tenantName: string
  phone: string
  unitLabel: string
  propertyName: string
  monthlyRent: number
  deposit: number
  leaseStart: string
  leaseEnd: string
}

export type AgreementScanStatus = 'ok' | 'review' | 'error'

export type AgreementScanResult = ScannedAgreementFields & {
  status: AgreementScanStatus
  errors: string[]
  warnings: string[]
  textLength: number
}

const parseAmount = (raw: string | undefined): number => {
  if (!raw) return 0
  const n = parseInt(raw.replace(/[^\d]/g, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

const normalizeDate = (raw: string): string => {
  const trimmed = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const slash = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slash) {
    const [, d, m, y] = slash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const named = trimmed.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (named) {
    const months: Record<string, string> = {
      jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
      apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', sept: '09', september: '09',
      oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
    }
    const m = months[named[2].toLowerCase().slice(0, 3)]
    if (m) return `${named[3]}-${m}-${named[1].padStart(2, '0')}`
  }
  return ''
}

/** Decode PDF literal strings from raw binary */
const decodePdfLiteral = (s: string): string =>
  s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))

/** Extract readable text from PDF data URL or raw base64 chunk */
export const extractTextFromPdfDataUrl = (dataUrl: string): string => {
  try {
    const base64 = dataUrl.split(',')[1] || ''
    const raw = atob(base64)
    const chunks: string[] = []

    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g
    let m: RegExpExecArray | null
    while ((m = tjRegex.exec(raw)) !== null) {
      const decoded = decodePdfLiteral(m[1]).trim()
      if (decoded.length > 1) chunks.push(decoded)
    }

    const hexRegex = /<([0-9A-Fa-f]+)>\s*Tj/g
    while ((m = hexRegex.exec(raw)) !== null) {
      const hex = m[1]
      let text = ''
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.slice(i, i + 2), 16)
        if (code >= 32 && code < 127) text += String.fromCharCode(code)
      }
      if (text.trim()) chunks.push(text.trim())
    }

    const readable = raw.match(/[\x20-\x7E]{4,}/g) || []
    chunks.push(...readable.filter((s) => !s.startsWith('%PDF') && !/^\/[A-Z]/.test(s)))

    return [...new Set(chunks)].join('\n').replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

export const extractTextFromDocx = async (buffer: ArrayBuffer): Promise<string> => {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return String(result.value || '').replace(/\s+/g, ' ').trim()
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

export const scanAgreementText = (text: string, fileName = ''): AgreementScanResult => {
  const errors: string[] = []
  const warnings: string[] = []
  const t = text.replace(/\r/g, '\n')

  let tenantName = ''
  const tenantPatterns = [
    /(?:tenant|lessee|occupant)(?:\s*name)?[:\s]+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/i,
    /(?:between|hereinafter\s+(?:called\s+)?)(?:the\s+)?tenant[,\s]+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/i,
    /Mr\.?\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/,
    /Ms\.?\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/,
  ]
  for (const re of tenantPatterns) {
    const hit = t.match(re)
    if (hit?.[1]) {
      tenantName = hit[1].trim()
      break
    }
  }

  let unitLabel = ''
  const unitHit =
    t.match(/unit\s*(?:no\.?|number|#)?[:\s]*([^\n,]{2,24})/i) ||
    t.match(/(?:flat|shop|room)\s*(?:no\.?)?[:\s]*([A-Za-z0-9\-\/\s]{1,20})/i)
  if (unitHit?.[1]) unitLabel = unitHit[1].trim().split(/\n/)[0].trim()

  let propertyName = ''
  const propHit =
    t.match(/(?:property|building|premises|located\s+at)[:\s]+([^\n,]{3,60})/i) ||
    t.match(/(?:at|situate\s+at)\s+([A-Z][A-Za-z0-9\s\-]{3,50})/)
  if (propHit?.[1]) propertyName = propHit[1].trim().replace(/\s+/g, ' ')

  let monthlyRent = 0
  const rentHit =
    t.match(/(?:monthly\s+)?rent(?:al)?(?:\s+amount)?[:\s]*(?:UGX?\s*)?([\d,]+)/i) ||
    t.match(/UGX?\s*([\d,]{5,})/i)
  if (rentHit?.[1]) monthlyRent = parseAmount(rentHit[1])

  let deposit = 0
  const depHit = t.match(/deposit(?:\s+amount)?[:\s]*(?:UGX?\s*)?([\d,]+)/i)
  if (depHit?.[1]) deposit = parseAmount(depHit[1])

  let phone = ''
  const phoneHit = t.match(/(?:\+256|256|0)\s*7\d{2}[\s-]?\d{3}[\s-]?\d{3}/)
  if (phoneHit?.[0]) phone = phoneHit[0].replace(/\s+/g, ' ').trim()

  let leaseStart = ''
  let leaseEnd = ''
  const startHit = t.match(/(?:lease\s+)?(?:start|commenc(?:e|ing)|from)[:\s]*([^\n]{6,30})/i)
  const endHit = t.match(/(?:lease\s+)?(?:end|expir(?:y|es)|until|to)[:\s]*([^\n]{6,30})/i)
  if (startHit?.[1]) leaseStart = normalizeDate(startHit[1].trim())
  if (endHit?.[1]) leaseEnd = normalizeDate(endHit[1].trim())

  const isoDates = [...t.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((d) => d[0])
  if (!leaseStart && isoDates[0]) leaseStart = isoDates[0]
  if (!leaseEnd && isoDates[1]) leaseEnd = isoDates[1]

  if (!text || text.length < 40) {
    errors.push('Could not read text — PDF may be a scanned image. Use text-based PDF or Word .docx.')
  }
  if (!tenantName) warnings.push('Tenant name not detected — will show as pending')
  if (!unitLabel) warnings.push('Unit not detected — assign manually after import')
  if (!propertyName) warnings.push('Property name not detected — a new building may be created')
  if (!monthlyRent) warnings.push('Monthly rent not detected — edit tenant after import')
  if (!leaseStart) warnings.push('Lease start not detected — using today')
  if (!leaseEnd) warnings.push('Lease end not detected — using +1 year from start')

  let status: AgreementScanStatus = 'ok'
  if (errors.length) status = 'error'
  else if (warnings.length) status = 'review'

  if (fileName && !tenantName) {
    const base = fileName.replace(/\.(pdf|docx?)$/i, '').replace(/[_-]/g, ' ')
    if (/[A-Za-z]+\s+[A-Za-z]+/.test(base)) tenantName = base.trim()
  }

  return {
    tenantName,
    phone,
    unitLabel,
    propertyName,
    monthlyRent,
    deposit,
    leaseStart,
    leaseEnd,
    status,
    errors,
    warnings,
    textLength: text.length,
  }
}

export const scanAgreementDocument = async (
  file: File,
  stored?: StoredDocument | null,
): Promise<{ scan: AgreementScanResult; document: StoredDocument | null; text: string }> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  let text = ''
  let document = stored || null

  if (ext === 'docx') {
    const buf = await file.arrayBuffer()
    text = await extractTextFromDocx(buf)
  } else if (ext === 'pdf') {
    const dataUrl = document?.dataUrl || (await readFileAsDataUrl(file))
    text = extractTextFromPdfDataUrl(dataUrl)
  }

  const scan = scanAgreementText(text, file.name)
  return { scan, document, text }
}

/** Unified hints for single-tenant attach modal */
export const extractAgreementHints = (text: string): Partial<ScannedAgreementFields> => {
  const scan = scanAgreementText(text)
  return {
    tenantName: scan.tenantName || undefined,
    phone: scan.phone || undefined,
    monthlyRent: scan.monthlyRent || undefined,
    deposit: scan.deposit || undefined,
    leaseStart: scan.leaseStart || undefined,
    leaseEnd: scan.leaseEnd || undefined,
  }
}
