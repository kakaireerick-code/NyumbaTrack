import { safeGet, safeSet } from './storage'

export type UnitMessage = {
  id: string
  ownerId: string
  unitId: string
  tenantId: string
  buildingId: string
  fromRole: 'tenant' | 'owner'
  authorName: string
  body: string
  createdAt: string
  readByOwner: boolean
  readByTenant: boolean
}

const MESSAGES_KEY = 'rt_unit_messages'

export const getMessages = (): UnitMessage[] => safeGet<UnitMessage[]>(MESSAGES_KEY, [])

export const saveMessages = (messages: UnitMessage[]): void => safeSet(MESSAGES_KEY, messages)

export const getThread = (unitId: string, tenantId: string): UnitMessage[] =>
  getMessages()
    .filter((m) => m.unitId === unitId && m.tenantId === tenantId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

export const getOwnerInbox = (ownerId: string): UnitMessage[] =>
  getMessages()
    .filter((m) => m.ownerId === ownerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

export const countUnreadForOwner = (ownerId: string): number =>
  getMessages().filter((m) => m.ownerId === ownerId && m.fromRole === 'tenant' && !m.readByOwner).length

export const countUnreadForTenant = (tenantId: string, unitId: string): number =>
  getMessages().filter(
    (m) => m.tenantId === tenantId && m.unitId === unitId && m.fromRole === 'owner' && !m.readByTenant,
  ).length

export const postMessage = (payload: Omit<UnitMessage, 'id' | 'createdAt' | 'readByOwner' | 'readByTenant'>): UnitMessage => {
  const msg: UnitMessage = {
    ...payload,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    readByOwner: payload.fromRole === 'owner',
    readByTenant: payload.fromRole === 'tenant',
  }
  saveMessages([...getMessages(), msg])
  return msg
}

export const markThreadReadByOwner = (ownerId: string, unitId: string, tenantId: string): void => {
  saveMessages(
    getMessages().map((m) =>
      m.ownerId === ownerId && m.unitId === unitId && m.tenantId === tenantId && m.fromRole === 'tenant'
        ? { ...m, readByOwner: true }
        : m,
    ),
  )
}

export const markThreadReadByTenant = (tenantId: string, unitId: string): void => {
  saveMessages(
    getMessages().map((m) =>
      m.tenantId === tenantId && m.unitId === unitId && m.fromRole === 'owner'
        ? { ...m, readByTenant: true }
        : m,
    ),
  )
}
