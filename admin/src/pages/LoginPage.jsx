import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Icon, useToast } from '../components/ui'
import './LoginPage.css'

// Atalhos de demo: preenchem o formulário com as credenciais dos usuários
// criados pelo seed do banco (ver backend/Data/DbSeeder.cs), só para agilizar testes.
const PRESETS = {
  admin: {
    label: 'Admin',
    hint: 'Acesso completo',
    icon: 'user',
    email: 'admin@goserv.local',
    password: 'admin123',
  },
  kitchen: {
    label: 'Cozinha',
    hint: 'Pedidos e mesas',
    icon: 'flame',
    email: 'cozinha@goserv.local',
    password: 'cozinha123',
  },
}

export default function LoginPage() {
  const { login, isAuthenticated, ready } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [preset, setPreset] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  // Se o usuário tentou acessar uma página protegida sem estar logado, o
  // ProtectedRoute manda pra cá guardando de onde veio, para voltar pra lá após o login.
  const from = location.state?.from?.pathname || '/'

  React.useEffect(() => {
    if (ready && isAuthenticated) navigate(from, { replace: true })
  }, [ready, isAuthenticated, from, navigate])

  function applyPreset(key) {
    const p = PRESETS[key]
    if (!p) return
    setPreset(key)
    setEmail(p.email)
    setPassword(p.password)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err, { title: 'Não foi possível entrar' })
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null
  if (isAuthenticated) return <Navigate to={from} replace />

  return (
    <div className="login-page">
      <aside className="login-hero">
        <div className="hero-brand">
          <span className="brand-mark">
            <Icon name="utensils" size={20} />
          </span>
          <span>GoServ</span>
        </div>
        <div className="hero-copy">
          <h2>Seu restaurante, do QR code à cozinha.</h2>
          <p>
            Cardápio digital, pedidos em tempo real, mesas e relatórios num só
            painel.
          </p>
        </div>
        <ul className="hero-points">
          <li><Icon name="qr" size={16} /> Pedido direto da mesa via QR</li>
          <li><Icon name="flame" size={16} /> Quadro da cozinha ao vivo</li>
          <li><Icon name="chart" size={16} /> Vendas e ticket médio do dia</li>
        </ul>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-head">
            <h1>Entrar no painel</h1>
            <p>Use um perfil de demonstração ou suas credenciais.</p>
          </div>

          <div className="presets" role="group" aria-label="Perfis de demo">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={`preset ${preset === key ? 'on' : ''}`}
                onClick={() => applyPreset(key)}
              >
                <span className="preset-icon">
                  <Icon name={p.icon} size={16} />
                </span>
                <span>
                  <strong>{p.label}</strong>
                  <small>{p.hint}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="divider"><span>ou</span></div>

          <label className="field">
            <span>E-mail</span>
            <input
              className="input"
              type="email"
              required
              autoComplete="username"
              placeholder="voce@restaurante.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setPreset('')
              }}
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPreset('')
              }}
            />
          </label>

          <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
            {!busy && <Icon name="arrowRight" size={16} />}
          </button>
        </form>
      </main>
    </div>
  )
}
