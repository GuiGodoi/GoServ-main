import React from 'react'
import { api } from '../services/api'
import { connectKitchenHub } from '../services/kitchenHub'
import { useContentLoading } from '../components/ui'
import { elapsedLabel } from '../utils'

const COLUMNS = [
  { status: 'Received', title: 'Recebido', next: 'Preparing', nextLabel: 'Iniciar preparo' },
  { status: 'Preparing', title: 'Em preparo', next: 'Ready', nextLabel: 'Marcar como pronto' },
  { status: 'Ready', title: 'Pronto', next: 'Delivered', nextLabel: 'Confirmar entrega' },
]

export default function KitchenPage() {
  const [orders, setOrders] = React.useState([])
  const [error, setError] = React.useState('')
  const [live, setLive] = React.useState('connecting')
  const [busyId, setBusyId] = React.useState(null)
  const [booting, setBooting] = React.useState(true)
  const [, setTick] = React.useState(0)
  useContentLoading(booting)

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const upsertOrder = React.useCallback((order) => {
    setOrders((prev) => {
      const without = prev.filter((o) => o.id !== order.id)
      if (order.status === 'Delivered' || order.status === 'Cancelled') {
        return without
      }
      return [order, ...without].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
    })
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let connection

    async function boot() {
      try {
        setError('')
        const list = await api.getOrders()
        if (cancelled) return
        setOrders(
          list.filter(
            (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
          )
        )

        connection = connectKitchenHub({
          onCreated: (order) => upsertOrder(order),
          onUpdated: (order) => upsertOrder(order),
          onStatus: (status) => {
            if (!cancelled) setLive(status)
          },
        })
        await connection.start()
        if (!cancelled) setLive('online')
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Falha ao carregar a cozinha')
          setLive('offline')
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    boot()
    return () => {
      cancelled = true
      connection?.stop()
    }
  }, [upsertOrder])

  async function advance(order, nextStatus) {
    setBusyId(order.id)
    setError('')
    try {
      const updated = await api.updateOrderStatus(order.id, nextStatus)
      upsertOrder(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function cancel(order) {
    if (!confirm(`Cancelar pedido #${order.id}?`)) return
    setBusyId(order.id)
    try {
      const updated = await api.updateOrderStatus(order.id, 'Cancelled')
      upsertOrder(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="kitchen">
      <header className="head">
        <div>
          <h1>Cozinha — Lanchonete do Zé</h1>
          <p>
            {orders.length} pedidos abertos
            {live === 'online' ? ' · CONECTADO ●' : live === 'connecting' ? ' · conectando…' : ' · OFFLINE'}
          </p>
        </div>
        <span className={`pulse ${live}`}>
          {live === 'online' ? 'Conectado' : live === 'connecting' ? 'Conectando…' : 'Offline'}
        </span>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="board">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status)
          return (
            <div key={col.status} className="column">
              <h2>
                {col.title}
                <span>{columnOrders.length}</span>
              </h2>
              <div className="stack">
                {columnOrders.length === 0 && (
                  <p className="empty">Nenhum pedido</p>
                )}
                {columnOrders.map((order) => (
                  <article key={order.id} className="ticket">
                    <div className="ticket-head">
                      <strong>
                        #{String(order.id).padStart(4, '0')} ·{' '}
                        {order.tableLabel || 'Sem mesa'}
                      </strong>
                      <span className="clock">{elapsedLabel(order.createdAt)}</span>
                    </div>
                    <ul>
                      {order.items.map((item) => {
                        const bits = [
                          item.notes,
                          ...(item.addons || []).map((a) => `+ ${a.name}`),
                        ].filter(Boolean)
                        return (
                          <li key={item.id}>
                            <strong>
                              {item.quantity}× {item.menuItemName}
                            </strong>
                            {bits.length > 0 && (
                              <span className="obs">{bits.join(' · ')}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {order.customerNotes && (
                      <span className="obs">Pedido: {order.customerNotes}</span>
                    )}
                    <div className="actions">
                      {col.status === 'Received' && (
                        <button
                          type="button"
                          className="ghost"
                          disabled={busyId === order.id}
                          onClick={() => cancel(order)}
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        className={col.status === 'Ready' ? 'ghost-act' : ''}
                        disabled={busyId === order.id}
                        onClick={() => advance(order, col.next)}
                      >
                        {col.nextLabel}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .kitchen { max-width: none; }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .head h1 { margin: 0 0 0.25rem; font-size: 1.35rem; }
        .head p { margin: 0; color: var(--muted); font-family: var(--mono); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .pulse {
          font-family: var(--mono);
          font-size: 0.75rem;
          text-transform: uppercase;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          border: 1px solid var(--line);
        }
        .pulse.online {
          color: var(--accent);
          background: rgba(31, 107, 74, 0.12);
          border-color: transparent;
        }
        .pulse.connecting, .pulse.offline { color: var(--muted); }
        .error { color: var(--danger); }
        .board {
          display: grid;
          grid-template-columns: repeat(3, minmax(220px, 1fr));
          gap: 0;
          align-items: stretch;
          border: 1px solid var(--line);
          border-radius: 4px;
          overflow: hidden;
          background: var(--panel);
        }
        .column {
          border-right: 1px solid var(--line);
          min-height: 280px;
          padding: 0;
        }
        .column:last-child { border-right: none; }
        .column h2 {
          margin: 0;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          padding: 0.65rem 0.75rem;
          background: var(--bg);
          border-bottom: 1px solid var(--line);
          font-weight: 700;
        }
        .column h2 span {
          font-family: var(--mono);
          color: var(--muted);
          font-weight: 600;
        }
        .stack { display: grid; gap: 0; padding: 0.5rem; }
        .empty {
          margin: 0;
          color: var(--muted);
          font-size: 0.85rem;
          padding: 0.5rem 0.25rem;
        }
        .ticket {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 0.65rem;
          margin-bottom: 0.5rem;
        }
        .ticket-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.4rem;
          font-size: 0.9rem;
        }
        .clock {
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.35rem;
        }
        li {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.92rem;
        }
        .obs {
          display: inline-block;
          font-size: 0.78rem;
          background: var(--bg);
          border-left: 2px solid var(--ink);
          padding: 0.15rem 0.4rem;
          margin: 0.1rem 0;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.4rem;
          margin-top: 0.65rem;
        }
        .actions button {
          border: none;
          background: var(--ink);
          color: #fff;
          padding: 0.45rem 0.7rem;
          border-radius: 2px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.82rem;
        }
        .actions button:disabled { opacity: 0.6; }
        .actions .ghost {
          background: transparent;
          color: var(--danger);
          border: 1px solid var(--line);
        }
        .actions .ghost-act {
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--ink);
        }
        @media (max-width: 900px) {
          .board { grid-template-columns: 1fr; }
          .column { border-right: none; border-bottom: 1px solid var(--line); }
        }
      `}</style>
    </section>
  )
}
