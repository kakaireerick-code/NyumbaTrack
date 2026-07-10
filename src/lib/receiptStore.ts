import { safeGet, safeSet } from './storage'

export type ReceiptSnapshot = {
  receiptId: string
  receiptNo: string
  paymentId?: string
  ownerId: string
  tenantId?: string
  unitId?: string
  issuedAt: string
  companyName: string
  propertyName: string
  propertyAddress: string
  tenantName: string
  unitNumber: string
  period: string
  paymentType: string
  paymentTypeLabel: string
  amount: number
  amountFormatted: string
  method: string
  reference: string
  balance: number
  balanceFormatted: string
  isPaidInFull: boolean
  issuedBy: string
  notes: string
  status: string
}

const RECEIPTS_KEY = 'rt_receipts'

export const getReceipts = (): ReceiptSnapshot[] =>
  safeGet<ReceiptSnapshot[]>(RECEIPTS_KEY, [])

export const saveReceipts = (receipts: ReceiptSnapshot[]): void =>
  safeSet(RECEIPTS_KEY, receipts)

export const getReceiptById = (receiptId: string): ReceiptSnapshot | undefined =>
  getReceipts().find((r) => r.receiptId === receiptId || r.receiptNo === receiptId)

export const saveReceiptSnapshot = (snapshot: ReceiptSnapshot): void => {
  const all = getReceipts().filter(
    (r) => r.receiptId !== snapshot.receiptId && r.receiptNo !== snapshot.receiptNo,
  )
  saveReceipts([...all, snapshot])
}

export const receiptsForTenant = (tenantId: string): ReceiptSnapshot[] =>
  getReceipts().filter((r) => r.tenantId === tenantId)

export const receiptsForOwner = (ownerId: string): ReceiptSnapshot[] =>
  getReceipts().filter((r) => r.ownerId === ownerId)
