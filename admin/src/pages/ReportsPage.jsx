import React from 'react'
import { api } from '../services/api'
import { EmptyState, Icon, PageHeader, useContentLoading, useToast } from '../components/ui'
import { formatPrice, todayInputValue, formatDayLabel } from '../utils'
import './ReportsPage.css'

const STATUS_LABEL = {
  AwaitingPayment: 'Aguardando pagamento',
  Received: 'Recebidos',
  Preparing: 'Em preparo',
  Ready: 'Prontos',
  Delivered: 'Entregues',
  Cancelled: 'Cancelados',
}

// Dashboard simples do dia atual: vendas, ticket médio, ranking dos produtos
// mais vendidos (barras horizontais) e pedidos por status.
export default function ReportsPage() {
  const toast = useToast()
  const date = todayInputValue()
  const [report, setReport] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  useContentLoading(loading)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await api.getDailyReport(date)
        if (!cancelled) setReport(data)
      } catch (e) {
        if (!cancelled) {
          toast.error(e)
          setReport(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [date, toast])

  // Maior quantidade vendida entre os itens, usada para calcular o
  // comprimento proporcional (%) de cada barra do ranking.
  const topItems = report?.topItems?.slice(0, 8) ?? []
  const maxQty = topItems.length
    ? Math.max(...topItems.map((i) => i.quantitySold), 1)
    : 1

  return (
    <section className="page">
      <PageHeader
        title="Relatórios"
        description="Desempenho de vendas do dia."
        actions={<span className="date-chip"><Icon name="clock" size={14} />{formatDayLabel(date)}</span>}
      />

      {!loading && !report && (
        <div className="card">
          <EmptyState icon="chart" title="Não foi possível carregar o relatório">
            Recarregue a página para tentar de novo.
          </EmptyState>
        </div>
      )}

      {!loading && report && (
        <>
          <div className="home-kpis">
            <div className="kpi-card">
              <span className="kpi-icon"><Icon name="wallet" /></span>
              <span className="kpi-label">Vendas do dia</span>
              <strong>{formatPrice(report.totalSales)}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-icon"><Icon name="receipt" /></span>
              <span className="kpi-label">Pedidos</span>
              <strong>{report.ordersCount}</strong>
            </div>
            <div className="kpi-card">
              <span className="kpi-icon"><Icon name="trending" /></span>
              <span className="kpi-label">Ticket médio</span>
              <strong>{formatPrice(report.averageTicket)}</strong>
            </div>
          </div>

          <div className="reports-grid">
            <div className="card">
              <div className="card-header">
                <h2>Mais vendidos</h2>
                <span className="muted small">quantidade</span>
              </div>
              {topItems.length === 0 ? (
                <EmptyState icon="chart" title="Sem vendas hoje">
                  Os produtos aparecem aqui conforme os pedidos forem pagos.
                </EmptyState>
              ) : (
                <ol className="rank">
                  {topItems.map((item, i) => (
                    <li
                      key={item.menuItemId}
                      title={`${item.name}: ${item.quantitySold} vendidos · ${formatPrice(item.revenue)}`}
                    >
                      <span className="rank-pos">{i + 1}</span>
                      <div className="rank-body">
                        <div className="rank-line">
                          <span className="rank-name">{item.name}</span>
                          <span className="rank-qty">{item.quantitySold}</span>
                        </div>
                        <div className="rank-track">
                          <i style={{ width: `${(item.quantitySold / maxQty) * 100}%` }} />
                        </div>
                        <span className="rank-rev">{formatPrice(item.revenue)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Pedidos por status</h2>
              </div>
              {(report.byStatus?.length ?? 0) === 0 ? (
                <EmptyState icon="receipt" title="Nenhum pedido hoje" />
              ) : (
                <ul className="status-list">
                  {report.byStatus.map((s) => (
                    <li key={s.status}>
                      <span>{STATUS_LABEL[s.status] || s.status}</span>
                      <strong>{s.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
