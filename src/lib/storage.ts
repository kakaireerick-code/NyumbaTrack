export const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export const safeSet = (key: string, val: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* ignore quota / private mode */
  }
}

export const safeRemove = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
