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

export const getOwnerBuilding = (building: Record<string, unknown> | null | undefined) => building

export const getOwnerUnit = (unit: Record<string, unknown> | null | undefined) => unit
