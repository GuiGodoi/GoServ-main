import React from 'react'
import { api } from '../services/api'
import { useContentLoading } from '../components/ui'
import { formatPrice, todayInputValue, formatDayLabel } from '../utils'

export default function ReportsPage() {
  const date = todayInputValue()
  const [report, setReport] = React.useState(null)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  useContentLoading(loading)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getDailyReport(date)
        if (!cancelled) setReport(data)
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
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
  }, [date])

  const maxQty = report?.topItems?.length
    ? Math.max(...report.topItems.map((i) => i.quantitySold), 1)
    : 1

  return (
    <section className="page">
      <header className="bar">
        <h1>Relatórios</h1>
        <span className="day">{formatDayLabel(date)}</span>
      </header>

      {error && <p className="error">{error}</p>}

      {!loading && report && (
        <>
          <div className="kpi">
            <div>
              <div className="k">Vendas do dia</div>
              <div className="n">{formatPrice(report.totalSales)}</div>
            </div>
            <div>
              <div className="k">Pedidos</div>
              <div className="n">{report.ordersCount}</div>
            </div>
            <div>
              <div className="k">Ticket médio</div>
              <div className="n">{formatPrice(report.averageTicket)}</div>
            </div>
          </div>

          <p className="section-label">Itens mais vendidos</p>
          <div className="chart">
            {report.topItems.length === 0 ? (
              <p className="muted">Sem vendas neste dia.</p>
            ) : (
              report.topItems.slice(0, 6).map((item) => (
                <div key={item.menuItemId} className="bar-col" title={item.name}>
                  <i style={{ height: `${(item.quantitySold / maxQty) * 100}%` }} />
                  <span>{item.quantitySold}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <style>{`
        .bar {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--line);
        }
        h1 { margin: 0; font-size: 1.25rem; }
        .day {
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.05em;
        }
        .kpi {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .kpi > div {
          flex: 1;
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 0.85rem;
          background: var(--panel);
        }
        .k {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .n {
          font-size: 1.45rem;
          font-weight: 700;
          margin-top: 0.35rem;
        }
        .section-label {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 0.5rem;
        }
        .chart {
          border: 1px solid var(--line);
          height: 140px;
          display: flex;
          align-items: flex-end;
          gap: 0.55rem;
          padding: 0.85rem;
          background: var(--panel);
        }
        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          height: 100%;
          justify-content: flex-end;
        }
        .bar-col i {
          display: block;
          width: 100%;
          min-height: 4px;
          background: var(--bg);
          border: 1px solid var(--line);
        }
        .bar-col span {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--muted);
        }
        .error { color: var(--danger); }
        .muted { color: var(--muted); }
        @media (max-width: 640px) {
          .kpi { flex-direction: column; }
        }
      `}</style>
    </section>
  )
}