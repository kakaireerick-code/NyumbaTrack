/** Multi-landlord data isolation by ownerId */

export const DEMO_OWNER_ID = 'u-owner-demo'

export const getOwnerIdForUser = (user: Record<string, unknown> | null | undefined): string | null => {
  if (!user) return null
  if (user.role === 'tenant') return String(user.ownerId || '')
  if (user.role === 'caretaker') {
    return String(user.ownerId || DEMO_OWNER_ID)
  }
  return String(user.id || '')
}

export const belongsToOwner = (
  record: Record<string, unknown> | null | undefined,
  ownerId: string | null,
): boolean => {
  if (!record || !ownerId) return false
  const rid = record.ownerId
  if (!rid) return ownerId === DEMO_OWNER_ID
  return String(rid) === ownerId
}

export const filterByOwner = <T extends Record<string, unknown>>(
  records: T[],
  ownerId: string | null,
): T[] => {
  if (!ownerId) return []
  return records.filter((r) => belongsToOwner(r, ownerId))
}

export const scopeRecord = <T extends Record<string, unknown>>(record: T, ownerId: string): T => ({
  ...record,
  ownerId,
})
