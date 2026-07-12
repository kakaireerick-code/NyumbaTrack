import { safeGet, safeSet } from './storage'
import { addNotification } from './notifications'
import { isDemoId } from './demoLiveSeparation'

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

const idStr = (value: string | number | null | undefined): string => String(value ?? '')

export const getMessages = (): UnitMessage[] => safeGet<UnitMessage[]>(MESSAGES_KEY, [])

export const saveMessages = (messages: UnitMessage[]): void => safeSet(MESSAGES_KEY, messages)

export const getThread = (unitId: string, tenantId: string): UnitMessage[] =>
  getMessages()
    .filter((m) => idStr(m.unitId) === idStr(unitId) && idStr(m.tenantId) === idStr(tenantId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

export const getOwnerInbox = (
  ownerId: string,
  opts?: { excludeDemo?: boolean },
): UnitMessage[] =>
  getMessages()
    .filter((m) => {
      if (idStr(m.ownerId) !== idStr(ownerId)) return false
      if (opts?.excludeDemo) {
        const demoThread =
          String(m.id || '').startsWith('demo-msg-') ||
          isDemoId(m.unitId) ||
          isDemoId(m.tenantId)
        if (demoThread) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

export const countUnreadForOwner = (
  ownerId: string,
  opts?: { excludeDemo?: boolean },
): number =>
  getOwnerInbox(ownerId, opts).filter(
    (m) => m.fromRole === 'tenant' && !m.readByOwner,
  ).length

export const countUnreadForTenant = (tenantId: string, unitId: string): number =>
  getMessages().filter(
    (m) =>
      idStr(m.tenantId) === idStr(tenantId) &&
      idStr(m.unitId) === idStr(unitId) &&
      m.fromRole === 'owner' &&
      !m.readByTenant,
  ).length

export const postMessage = (payload: Omit<UnitMessage, 'id' | 'createdAt' | 'readByOwner' | 'readByTenant'>): UnitMessage => {
  const ownerId = idStr(payload.ownerId)
  if (!ownerId) {
    throw new Error('postMessage requires ownerId')
  }
  if (isDemoId(payload.unitId) || isDemoId(payload.tenantId)) {
    throw new Error('Cannot post messages to demo practice threads')
  }
  const msg: UnitMessage = {
    ...payload,
    ownerId,
    unitId: idStr(payload.unitId),
    tenantId: idStr(payload.tenantId),
    buildingId: idStr(payload.buildingId),
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    readByOwner: payload.fromRole === 'owner',
    readByTenant: payload.fromRole === 'tenant',
  }
  saveMessages([...getMessages(), msg])

  if (payload.fromRole === 'tenant') {
    addNotification({
      ownerId: payload.ownerId,
      role: 'property_owner',
      title: 'New tenant message',
      body: `${payload.authorName}: ${payload.body.slice(0, 100)}`,
      kind: 'message',
      actionPage: 'messages',
      push: false,
    })
  } else {
    addNotification({
      ownerId: payload.ownerId,
      role: 'tenant',
      userId: payload.tenantId,
      title: 'Message from landlord',
      body: payload.body.slice(0, 100),
      kind: 'message',
      actionPage: 'my-messages',
      push: false,
    })
  }

  return msg
}

export const markThreadReadByOwner = (ownerId: string, unitId: string, tenantId: string): void => {
  saveMessages(
    getMessages().map((m) =>
      idStr(m.ownerId) === idStr(ownerId) &&
      idStr(m.unitId) === idStr(unitId) &&
      idStr(m.tenantId) === idStr(tenantId) &&
      m.fromRole === 'tenant'
        ? { ...m, readByOwner: true }
        : m,
    ),
  )
}

export const markThreadReadByTenant = (tenantId: string, unitId: string): void => {
  saveMessages(
    getMessages().map((m) =>
      idStr(m.tenantId) === idStr(tenantId) &&
      idStr(m.unitId) === idStr(unitId) &&
      m.fromRole === 'owner'
        ? { ...m, readByTenant: true }
        : m,
    ),
  )
}
