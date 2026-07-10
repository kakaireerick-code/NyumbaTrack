import { safeGet, safeSet } from './storage'
import { isDeployedApp } from './environment'

export type AppMode = 'live' | 'demo'

const MODE_KEY = 'rt_app_mode'

export const getAppMode = (): AppMode => {
  const stored = safeGet<AppMode>(MODE_KEY, 'live')
  return stored === 'demo' ? 'demo' : 'live'
}

export const setAppMode = (mode: AppMode): void => safeSet(MODE_KEY, mode)

export const isDemoMode = (): boolean => getAppMode() === 'demo'

export const canToggleDemoMode = (role: string): boolean =>
  !isDeployedApp() || role === 'property_owner'

export const appModeLabel = (mode: AppMode): string =>
  mode === 'demo' ? 'Demo / training' : 'Live data'
