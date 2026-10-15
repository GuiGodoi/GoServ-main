import React from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import {
  PageLoading,
  ContentLoadingProvider,
  DialogProvider,
  Icon,
  ToastProvider,
} from './components/ui'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TablesPage from './pages/TablesPage'
import KitchenPage from './pages/KitchenPage'
import ReportsPage from './pages/ReportsPage'
import QrCodesPage from './pages/QrCodesPage'
import PromotionsPage from './pages/PromotionsPage'
import './App.css'

// Itens do menu lateral, agrupados por seção. "admin: true" = só aparece
// para o papel Admin; o papel Kitchen vê só cozinha/mesas/QR.
const NAV_SECTIONS = [
  {
    title: 'Operação',
    items: [
      { to: '/cozinha', label: 'Cozinha', icon: 'flame' },
      { to: '/mesas', label: 'Mesas', icon: 'table' },
      { to: '/qrcodes', label: 'QR Codes', icon: 'qr' },
    ],
  },
  {
    title: 'Cardápio',
    items: [
      { to: '/produtos', label: 'Produtos', icon: 'package', admin: true },
      { to: '/categorias', label: 'Categorias', icon: 'layers', admin: true },
      { to: '/promocoes', label: 'Promoções', icon: 'tag', admin: true },
    ],
  },
  {
    title: 'Gestão',
    items: [{ to: '/relatorios', label: 'Relatórios', icon: 'chart', admin: true }],
  },
]

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase()
}

// Layout com barra lateral + área de conteúdo, usado em todas as páginas
// depois do login. Cada link do menu só aparece se o usuário logado tiver o
// papel (role) necessário — "Admin" vê tudo, "Kitchen" só cozinha/mesas/QR.
function Shell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'Admin'
  const wide = location.pathname.includes('cozinha')
  const [navOpen, setNavOpen] = React.useState(false)
  const [navLoading, setNavLoading] = React.useState(false)
  const [pageLoading, setPageLoading] = React.useState(false)

  React.useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Mostra a barra de "carregando" por um tempo mínimo a cada troca de página,
  // só para dar um feedback visual mesmo em navegações muito rápidas.
  React.useEffect(() => {
    setNavLoading(true)
    const t = setTimeout(() => setNavLoading(false), 420)
    return () => clearTimeout(t)
  }, [location.pathname])

  const loading = navLoading || pageLoading

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <header className="mobile-bar">
        <span className="brand-mark">
          <Icon name="utensils" size={16} />
        </span>
        <strong>GoServ</strong>
        <button
          type="button"
          className="icon-btn"
          aria-label={navOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <Icon name={navOpen ? 'x' : 'menu'} size={20} />
        </button>
      </header>

      <div className="scrim" onClick={() => setNavOpen(false)} />

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="utensils" size={18} />
          </span>
          <div>
            <span className="logo">GoServ</span>
            <span className="brand-sub">
              {user?.role === 'Kitchen' ? 'Painel da cozinha' : 'Painel administrativo'}
            </span>
          </div>
        </div>

        <nav>
          <NavLink to="/" end className="nav-link">
            <Icon name="home" />
            Início
          </NavLink>
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((i) => !i.admin || isAdmin)
            if (items.length === 0) return null
            return (
              <div key={section.title} className="nav-section">
                <span className="nav-title">{section.title}</span>
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-link">
                    <Icon name={item.icon} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="user-box">
          <span className="avatar">{initials(user?.name)}</span>
          <div className="who">
            <strong>{user?.name}</strong>
            <span>{user?.role === 'Kitchen' ? 'Cozinha' : 'Administrador'}</span>
          </div>
          <button type="button" className="logout" onClick={logout} aria-label="Sair" title="Sair">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <main className={`main-pane ${wide ? 'wide' : ''}`}>
        <PageLoading active={loading} />
        <div className="content">
          <ContentLoadingProvider setPageLoading={setPageLoading}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/cozinha"
                element={
                  <ProtectedRoute roles={['Admin', 'Kitchen']}>
                    <KitchenPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produtos"
                element={
                  <ProtectedRoute roles={['Admin']}>
                    <ProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promocoes"
                element={
                  <ProtectedRoute roles={['Admin']}>
                    <PromotionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categorias"
                element={
                  <ProtectedRoute roles={['Admin']}>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute roles={['Admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mesas"
                element={
                  <ProtectedRoute roles={['Admin', 'Kitchen']}>
                    <TablesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qrcodes"
                element={
                  <ProtectedRoute roles={['Admin', 'Kitchen']}>
                    <QrCodesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ContentLoadingProvider>
        </div>
      </main>
    </div>
  )
}

// Raiz do app: só duas rotas de "primeiro nível" — login (pública) e tudo o
// resto, que passa pelo ProtectedRoute (exige estar logado) antes de chegar no Shell.
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DialogProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Shell />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </DialogProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
