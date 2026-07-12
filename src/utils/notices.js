import { fmtDate } from './helpers'
import { getNotices, saveNoticeSnapshot } from '../lib/noticeStore'
import {
  buildReadOnlyWordDocument,
  openReadOnlyWordDocument,
  downloadReadOnlyWordDocument,
} from './readOnlyDocuments'

export const generateNoticeNo = (trackerNotices = []) => {
  const year = new Date().getFullYear()
  const prefix = `NTC-${year}-`
  const existing = [
    ...trackerNotices.filter((n) => n.noticeNo?.startsWith(prefix)).map((n) => n.noticeNo),
    ...getNotices().filter((n) => n.noticeNo?.startsWith(prefix)).map((n) => n.noticeNo),
  ]
  const nums = existing
    .map((no) => parseInt(String(no).slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export const generateUniqueNoticeId = (noticeNo) => {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36)
  return `${noticeNo}-${suffix}`
}

export const buildNoticeData = ({
  type,
  body,
  tenant,
  unit,
  building,
  settings,
  servedBy,
  followUpDate,
  noticeNo,
  noticeId,
  ownerId,
}) => {
  const tenantName = [tenant?.firstName, tenant?.lastName].filter(Boolean).join(' ') || 'Tenant'
  const companyName = settings?.companyName || building?.name || 'Nyumba-track'
  const no = noticeNo || generateNoticeNo()
  const id = noticeId || generateUniqueNoticeId(no)

  return {
    noticeId: id,
    noticeNo: no,
    type: type || 'Legal Notice',
    body: body || '',
    ownerId: ownerId || tenant?.ownerId || building?.ownerId || '',
    tenantId: tenant?.id || '',
    unitId: tenant?.unitId,
    buildingId: tenant?.buildingId,
    tenantName,
    unitNumber: unit?.unitNumber || '—',
    propertyName: building?.name || companyName,
    propertyAddress: building?.address || settings?.companyAddress || '',
    servedAt: new Date().toISOString().split('T')[0],
    servedBy: servedBy || settings?.managerName || 'Property Manager',
    followUpDate: followUpDate || '',
    companyName,
    issuedBy: settings?.managerName || 'Property Manager',
  }
}

/** Owner only — writes immutable notice snapshot */
export const issueNotice = (params) => {
  const data = buildNoticeData(params)
  saveNoticeSnapshot(data)
  return data
}

export const buildNoticeWordDocument = (data) =>
  buildReadOnlyWordDocument({
    title: data.type || 'Legal Notice',
    documentNo: data.noticeNo,
    bodyText: data.body,
    meta: [
      { label: 'Date', value: fmtDate(data.servedAt) },
      { label: 'To', value: data.tenantName },
      { label: 'Unit', value: data.unitNumber },
      { label: 'Property', value: data.propertyName },
      { label: 'Served by', value: data.servedBy },
      ...(data.followUpDate ? [{ label: 'Follow-up', value: fmtDate(data.followUpDate) }] : []),
    ],
    footer: `Official legal notice ${data.noticeNo} — read only, not editable. Issued by ${data.issuedBy}. Nyumba-track`,
  })

export const openNoticeInWord = (data) => {
  const html = buildNoticeWordDocument(data)
  const ok = openReadOnlyWordDocument(html, `notice-${data.noticeNo}.doc`)
  if (!ok) downloadNoticeDocument(data)
  return ok
}

export const downloadNoticeDocument = (data) => {
  const html = buildNoticeWordDocument(data)
  downloadReadOnlyWordDocument(html, `notice-${data.noticeNo}.doc`)
}
