// Contexto de autenticação do painel admin: guarda o usuário logado e expõe
// login()/logout() para qualquer tela via useAuth().
import React from 'react'
import {
  api,
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from '../services/api'

const AuthContext = React.createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => getStoredUser())
  // "ready" evita mostrar a tela de login por um instante antes de confirmar
  // se o token salvo ainda é válido (evita o "piscar" login -> logado).
  const [ready, setReady] = React.useState(false)

  // Ao carregar o app, se já existe um token salvo, confirma com o backend
  // que ele ainda é válido (GET /api/auth/me) antes de considerar o usuário logado.
  React.useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getToken()
      if (!token) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const me = await api.me()
        if (!cancelled) setUser(me)
      } catch {
        clearSession()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    bootstrap()
    // Se o componente for desmontado antes da resposta chegar, "cancelled"
    // evita atualizar o estado de um componente que não existe mais.
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email, password) {
    const result = await api.login({ email, password })
    saveSession(result)
    setUser({
      name: result.name,
      email: result.email,
      role: result.role,
    })
    return result
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  const value = {
    user,
    ready,
    isAuthenticated: Boolean(user && getToken()),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
