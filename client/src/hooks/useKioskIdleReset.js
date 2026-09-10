import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useKioskMode } from '../hooks/useKioskMode'

const IDLE_MS = 90_000

/** No kiosk, volta ao cardápio após inatividade (exceto tela de status do pedido). */
export function useKioskIdleReset(homePath = '/') {
  const kiosk = useKioskMode()
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    if (!kiosk || !homePath) return
    if (location.pathname.includes('/pedido/')) return

    let timer
    const bump = () => {
      clearTimeout(timer)
      timer = setTimeout(() => navigate(homePath), IDLE_MS)
    }

    const events = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    bump()

    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, bump))
    }
  }, [kiosk, navigate, homePath, location.pathname])
}
