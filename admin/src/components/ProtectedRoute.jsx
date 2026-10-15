// Bloqueia o acesso a uma rota até confirmar login (e, opcionalmente, um
// papel/role específico). Usado para "envolver" páginas que exigem permissão.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { EmptyState } from './ui'

export default function ProtectedRoute({ children, roles }) {
  const { ready, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <EmptyState icon="clock" title="Carregando…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <EmptyState icon="lock" title="Acesso restrito">
        Seu perfil ({user.role}) não tem acesso a esta área.
      </EmptyState>
    )
  }

  return children
}
