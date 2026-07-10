/** Strip owner-only fields before passing data to tenant-facing components */

export const getTenantSafeBuilding = (building: Record<string, unknown> | null | undefined) => {
  if (!building) return null
  const { ownerNotes, internalFlags, expenses, maintenanceLog, netYield, ...safe } = building
  return safe
}

export const getTenantSafeUnit = (unit: Record<string, unknown> | null | undefined) => {
  if (!unit) return null
  const { ownerNotes, inviteCode, internalFlags, maintenanceLog, expenses, ...safe } = unit
  return safe
}

/** Tenant record safe for tenant portal — strips owner secrets and unshared documents */
export const getTenantSafeTenantRecord = (record: Record<string, unknown> | null | undefined) => {
  if (!record) return null
  const {
    ownerNotes,
    internalFlags,
    importSourcePath,
    importHistory,
    agreementPdf,
    shareAgreementWithTenant,
    blacklisted,
    blacklistReason,
    rating,
    nin,
    guarantorName,
    guarantorPhone,
    notes,
    dataSource,
    ...safe
  } = record

  const result: Record<string, unknown> = { ...safe }

  if (shareAgreementWithTenant && agreementPdf && typeof agreementPdf === 'object') {
    const doc = agreementPdf as Record<string, unknown>
    result.sharedAgreement = {
      fileName: doc.fileName,
      dataUrl: doc.dataUrl,
      uploadedAt: doc.uploadedAt,
    }
  }

  return result
}

export const getOwnerBuilding = (building: Record<string, unknown> | null | undefined) => building

export const getOwnerUnit = (unit: Record<string, unknown> | null | undefined) => unit

export const getOwnerTenant = (tenant: Record<string, unknown> | null | undefined) => tenant

/** Strip rent, deposit, and payment-related fields for caretaker views */
export const getCaretakerSafeUnit = (unit: Record<string, unknown> | null | undefined) => {
  if (!unit) return null
  const {
    monthlyRent,
    depositAmount,
    ownerNotes,
    inviteCode,
    expenses,
    maintenanceLog,
    netYield,
    ...safe
  } = unit
  return safe
}

export const getCaretakerSafeTenant = (tenant: Record<string, unknown> | null | undefined) => {
  if (!tenant) return null
  const {
    rentAmount,
    depositPaid,
    depositAmount,
    ownerNotes,
    rating,
    blacklisted,
    blacklistReason,
    ...safe
  } = tenant
  return safe
}

export const getCaretakerSafeBuilding = (building: Record<string, unknown> | null | undefined) => {
  if (!building) return null
  const { ownerNotes, expenses, maintenanceLog, netYield, ...safe } = building
  return safe
}
