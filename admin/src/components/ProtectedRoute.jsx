import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { ready, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <p style={{ padding: '2rem', color: 'var(--muted)' }}>Carregando…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <p style={{ padding: '2rem', color: 'var(--danger)' }}>
        Seu perfil ({user.role}) não tem acesso a esta área.
      </p>
    )
  }

  return children
}
