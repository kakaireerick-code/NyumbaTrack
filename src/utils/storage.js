import React from 'react'
import { safeGet, safeSet, safeRemove } from '../lib/storage.ts'

export { safeGet, safeSet, safeRemove }

export const usePersistedState = (key, initial) => {
  const [state, setState] = React.useState(() => safeGet(key, initial))
  const setPersisted = React.useCallback(
    (val) => {
      setState((prev) => {
        const next = typeof val === 'function' ? val(prev) : val
        safeSet(key, next)
        return next
      })
    },
    [key],
  )
  return [state, setPersisted]
}
