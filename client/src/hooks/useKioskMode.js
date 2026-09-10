import React from 'react'
import { useSearchParams } from 'react-router-dom'

const STORAGE_KEY = 'goserv_kiosk'

/** Ativa com ?kiosk=1 (ou kiosk=true). Persiste no sessionStorage do tablet. */
export function useKioskMode() {
  const [params] = useSearchParams()
  const [enabled, setEnabled] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  })

  React.useEffect(() => {
    const raw = params.get('kiosk')
    if (raw === null) return

    const on = raw === '1' || raw.toLowerCase() === 'true'
    if (on) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setEnabled(true)
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
      setEnabled(false)
    }
  }, [params])

  React.useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('kiosk')
    document.body.classList.add('kiosk')
    return () => {
      document.documentElement.classList.remove('kiosk')
      document.body.classList.remove('kiosk')
    }
  }, [enabled])

  return enabled
}
