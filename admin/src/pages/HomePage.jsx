import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../services/api'
import { Icon } from '../components/ui'
import { formatMoney, todayInputValue } from '../utils'
import './HomePage.css'

// Atalhos para cada seção. "admin: true" = só aparece para o papel Admin.
const SHORTCUTS = [
  { to: '/cozinha', icon: 'flame', title: 'Cozinha', text: 'Pedidos ao vivo e avanço de status.' },
  { to: '/mesas', icon: 'table', title: 'Mesas', text: 'Sessões abertas, consumo e teto de gastos.' },
  { to: '/qrcodes', icon: 'qr', title: 'QR Codes', text: 'Códigos para imprimir e senha do dia.' },
  { to: '/produtos', icon: 'package', title: 'Produtos', text: 'Itens do cardápio, fotos e preços.', admin: true },
  { to: '/promocoes', icon: 'tag', title: 'Promoções', text: 'Descontos com período definido.', admin: true },
  { to: '/relatorios', icon: 'chart', title: 'Relatórios', text: 'Vendas, ticket médio e mais vendidos.', admin: true },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// Página inicial do painel: saudação, números do dia (só Admin) e atalhos.
export default function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const [report, setReport] = React.useState(null)

  // Resumo do dia é "bônus": se a chamada falhar, a página só não mostra os números.
  React.useEffect(() => {
    if (!isAdmin) return undefined
    let cancelled = false
    api
      .getDailyReport(todayInputValue())
      .then((r) => !cancelled && setReport(r))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const firstName = user?.name?.split(' ')[0] || ''
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section className="home">
      <header className="home-hero">
        <span className="eyebrow">{today}</span>
        <h1>
          {greeting()}, {firstName}
        </h1>
        <p>Aqui está o resumo do seu restaurante hoje.</p>
      </header>

      {isAdmin && (
        <div className="home-kpis">
          <div className="kpi-card">
            <span className="kpi-icon"><Icon name="wallet" /></span>
            <span className="kpi-label">Vendas hoje</span>
            <strong>{report ? formatMoney(report.totalSales) : '—'}</strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon"><Icon name="receipt" /></span>
            <span className="kpi-label">Pedidos</span>
            <strong>{report ? report.ordersCount : '—'}</strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon"><Icon name="trending" /></span>
            <span className="kpi-label">Ticket médio</span>
            <strong>{report ? formatMoney(report.averageTicket) : '—'}</strong>
          </div>
        </div>
      )}

      <h2 className="home-section">Acesso rápido</h2>
      <div className="shortcut-grid">
        {SHORTCUTS.filter((s) => !s.admin || isAdmin).map((s) => (
          <Link key={s.to} to={s.to} className="shortcut">
            <span className="shortcut-icon">
              <Icon name={s.icon} size={20} />
            </span>
            <span className="shortcut-text">
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </span>
            <Icon name="arrowRight" size={16} className="shortcut-arrow" />
          </Link>
        ))}
      </div>
    </section>
  )
}
