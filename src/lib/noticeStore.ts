import { safeGet, safeSet } from './storage'

export type NoticeSnapshot = {
  noticeId: string
  noticeNo: string
  type: string
  body: string
  ownerId: string
  tenantId: string
  unitId?: string
  buildingId?: string
  tenantName: string
  unitNumber: string
  propertyName: string
  propertyAddress: string
  servedAt: string
  servedBy: string
  followUpDate?: string
  companyName: string
  issuedBy: string
}

const NOTICES_KEY = 'rt_notice_snapshots'

export const getNotices = (): NoticeSnapshot[] =>
  safeGet<NoticeSnapshot[]>(NOTICES_KEY, [])

export const saveNotices = (notices: NoticeSnapshot[]): void =>
  safeSet(NOTICES_KEY, notices)

export const getNoticeById = (noticeId: string): NoticeSnapshot | undefined =>
  getNotices().find((n) => n.noticeId === noticeId || n.noticeNo === noticeId)

export const saveNoticeSnapshot = (snapshot: NoticeSnapshot): void => {
  const all = getNotices().filter(
    (n) => n.noticeId !== snapshot.noticeId && n.noticeNo !== snapshot.noticeNo,
  )
  saveNotices([...all, snapshot])
}

export const noticesForTenant = (tenantId: string): NoticeSnapshot[] =>
  getNotices().filter((n) => n.tenantId === tenantId)

export const noticesForOwner = (ownerId: string): NoticeSnapshot[] =>
  getNotices().filter((n) => n.ownerId === ownerId)
