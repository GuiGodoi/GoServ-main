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

  React.useEffect(() => {
    setNavLoading(true)
    const t = setTimeout(() => setNavLoading(false), 420)
    return () => clearTimeout(t)
  }, [location.pathname])

  const loading = navLoading || pageLoading

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <button
        type="button"
        className="nav-toggle"
        aria-label="Menu"
        onClick={() => setNavOpen((v) => !v)}
      >
        {navOpen ? 'Fechar' : 'Menu'}
      </button>

      <aside className="sidebar">
        <div className="brand">
          <span className="logo">GoServ</span>
          <span className="badge">{user?.role === 'Kitchen' ? 'Cozinha' : 'Admin'}</span>
        </div>
        <nav>
          {isAdmin && <NavLink to="/produtos">Produtos</NavLink>}
          {isAdmin && <NavLink to="/promocoes">Promoções</NavLink>}
          {isAdmin && <NavLink to="/categorias">Categorias</NavLink>}
          <NavLink to="/mesas">Mesas</NavLink>
          <NavLink to="/qrcodes">QR Codes</NavLink>
          {isAdmin && <NavLink to="/relatorios">Relatórios</NavLink>}
          <NavLink to="/cozinha">Cozinha</NavLink>
          <NavLink to="/" end>
            Início
          </NavLink>
        </nav>
        <div className="user-box">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
          <button type="button" className="logout" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className={`main-pane ${wide ? 'wide' : ''}`}>
        <PageLoading active={loading} />
        <div className={wide ? 'content wide' : 'content'}>
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

      <style>{`
        .shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
        }
        .nav-toggle {
          display: none;
          position: sticky;
          top: 0;
          z-index: 30;
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--line);
          background: var(--panel);
          padding: 0.75rem 1rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }
        .sidebar {
          padding: 1.5rem 1.1rem;
          border-right: 1px solid var(--line);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .brand {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .logo {
          font-weight: 700;
          font-size: 1.35rem;
          letter-spacing: -0.02em;
        }
        .badge {
          font-family: var(--mono);
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(31, 107, 74, 0.1);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        nav a {
          padding: 0.55rem 0.7rem;
          border-radius: 8px;
          color: var(--muted);
          font-weight: 500;
        }
        nav a:hover { background: var(--bg); color: var(--ink); }
        nav a.active {
          background: rgba(31, 107, 74, 0.12);
          color: var(--accent);
        }
        .user-box {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.85rem;
          color: var(--ink);
        }
        .user-box strong { color: var(--ink); }
        .user-box span { color: var(--muted); }
        .sidebar .logout,
        button.logout {
          margin-top: 0.5rem;
          align-self: flex-start;
          border: 1px solid var(--line) !important;
          background: #fff !important;
          color: var(--ink) !important;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .sidebar .logout:hover {
          background: var(--bg) !important;
        }
        .main-pane {
          position: relative;
          min-height: 100vh;
          min-width: 0;
          background: var(--bg);
        }
        .content {
          padding: 1.75rem 1.5rem 3rem;
          max-width: 960px;
        }
        .content.wide,
        .main-pane.wide .content {
          max-width: 1200px;
        }
        @media (max-width: 760px) {
          .shell { grid-template-columns: 1fr; }
          .nav-toggle { display: block; }
          .sidebar {
            display: none;
            border-right: none;
            border-bottom: 1px solid var(--line);
            padding-top: 0.75rem;
          }
          .shell.nav-open .sidebar { display: flex; }
          nav { flex-direction: row; flex-wrap: wrap; }
          .main-pane { min-height: calc(100vh - 48px); }
          .content {
            padding: 1rem 1rem 2.5rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
