import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchOrder } from '../services/api'
import { connectOrderHub } from '../services/orderHub'
import ClientTopBar from '../components/ClientTopBar'
import { formatPrice, formatClock } from '../utils'

const STATUS_LABEL = {
  AwaitingPayment: 'Aguardando pagamento',
  Received: 'Recebido pela cozinha',
  Preparing: 'Em preparo',
  Ready: 'Pronto',
  Delivered: 'Entregue',
  Cancelled: 'Cancelado',
}

/** Passos do wireframe T5 (após pagamento). */
const TRACK_STEPS = [
  { key: 'paid', label: 'Pagamento confirmado' },
  { key: 'Received', label: 'Recebido pela cozinha' },
  { key: 'Preparing', label: 'Em preparo' },
  { key: 'Ready', label: 'Pronto' },
]

function stepState(orderStatus, stepKey) {
  if (orderStatus === 'AwaitingPayment' || orderStatus === 'Cancelled') {
    return 'todo'
  }

  const rank = {
    paid: 0,
    Received: 1,
    Preparing: 2,
    Ready: 3,
    Delivered: 3,
  }

  const current = rank[orderStatus] ?? 0
  const step = rank[stepKey] ?? 0

  if (step < current) return 'done'
  if (step === current) return 'current'
  return 'todo'
}

export default function OrderStatusPage() {
  const { orderId: publicId, tableToken } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = React.useState(null)
  const [error, setError] = React.useState('')
  const [live, setLive] = React.useState('connecting')
  const readyAlertSent = React.useRef(false)

  const menuPath = tableToken ? `/mesa/${tableToken}` : '/'
  const payPath = tableToken
    ? `/mesa/${tableToken}/pagamento/${publicId}`
    : `/pagamento/${publicId}`

  React.useEffect(() => {
    let cancelled = false
    let connection

    async function boot() {
      try {
        const initial = await fetchOrder(publicId)
        if (cancelled) return
        setOrder(initial)

        if (initial.status === 'AwaitingPayment') {
          navigate(payPath, { replace: true })
          return
        }

        connection = connectOrderHub({
          publicId,
          onUpdated: (updated) => {
            if (cancelled) return
            setOrder(updated)
          },
          onStatus: (status) => {
            if (!cancelled) setLive(status)
          },
        })
        await connection.start()
        await connection.invoke('WatchOrder', publicId)
        if (!cancelled) setLive('online')
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Não foi possível acompanhar o pedido')
          setLive('offline')
        }
      }
    }

    boot()
    return () => {
      cancelled = true
      connection?.stop()
    }
  }, [publicId, navigate, payPath])

  React.useEffect(() => {
    if (order?.status !== 'Ready' || readyAlertSent.current) return
    readyAlertSent.current = true

    if (typeof window === 'undefined' || !('Notification' in window)) return

    const body = order.tableLabel
      ? `${order.tableLabel} · senha ${order.id}`
      : `Pedido #${order.id} está pronto para retirada.`

    if (Notification.permission === 'granted') {
      new Notification('GoServ — Pedido pronto!', { body })
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('GoServ — Pedido pronto!', { body })
        }
      })
    }
  }, [order])

  if (error) {
    return (
      <div className="page">
        <p className="err">{error}</p>
        <button type="button" className="primary" onClick={() => navigate(menuPath)}>
          Voltar ao cardápio
        </button>
        <Styles />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <p className="muted">Carregando pedido…</p>
        <Styles />
      </div>
    )
  }

  const isReady = order.status === 'Ready'
  const isDone = order.status === 'Delivered' || order.status === 'Cancelled'
  const paidAt = formatClock(order.createdAt)

  return (
    <div className={`page ${isReady ? 'ready-mode' : ''}`}>
      <ClientTopBar
        tableLabel={order.tableLabel}
        title={`Pedido #${String(order.id).padStart(4, '0')}`}
      />

      {isReady && (
        <div className="banner" role="status" aria-live="assertive">
          <p className="banner-title">Seu pedido está pronto!</p>
          <p className="banner-sub">
            {order.tableLabel
              ? `Retire na ${order.tableLabel}`
              : `Senha ${order.id}`}
          </p>
        </div>
      )}

      <div className="senha-block">
        <div className="senha-label">SENHA</div>
        <div className="senha">{order.id}</div>
        <p className="meta">
          {formatPrice(order.total)}
          <span className={`dot ${live}`}>
            {live === 'online' ? 'ao vivo' : live}
          </span>
        </p>
      </div>

      <div className="timeline">
        {TRACK_STEPS.map((step) => {
          const state = stepState(order.status, step.key)
          const mark =
            state === 'done' ? '✓' : state === 'current' ? '●' : '○'
          return (
            <div key={step.key} className={`row ${state}`}>
              <span>
                {mark} &nbsp;{step.label}
              </span>
              {(state === 'done' || state === 'current') && (
                <span className="clock">{paidAt}</span>
              )}
            </div>
          )
        })}
      </div>

      {order.status === 'Cancelled' && (
        <p className="err">Este pedido foi cancelado.</p>
      )}

      <div className="hint-box">
        Deixe esta tela aberta. Avisaremos aqui quando o pedido ficar pronto.
      </div>

      {!isDone && (
        <p className="hint-live">
          Atualiza sozinha pelo SignalR
          {STATUS_LABEL[order.status] ? ` · ${STATUS_LABEL[order.status]}` : ''}.
        </p>
      )}

      {isDone && (
        <button type="button" className="primary" onClick={() => navigate(menuPath)}>
          Fazer novo pedido
        </button>
      )}

      <Styles />
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .page {
        max-width: 420px;
        margin: 0 auto;
        padding: 0.75rem 1.15rem 3rem;
      }
      .senha-block {
        text-align: center;
        padding: 1.25rem 0 1.5rem;
        border-bottom: 1px solid var(--border);
      }
      .senha-label {
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 0.72rem;
        color: var(--muted);
        letter-spacing: 0.08em;
      }
      .senha {
        font-size: 3.2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.05;
        margin: 0.15rem 0;
      }
      .meta {
        margin: 0.35rem 0 0;
        color: var(--muted);
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        font-size: 0.85rem;
      }
      .dot {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.1rem 0.4rem;
        border-radius: 999px;
        border: 1px solid var(--border);
      }
      .dot.online {
        color: var(--accent);
        border-color: var(--accent);
      }
      .timeline {
        padding-top: 1rem;
      }
      .timeline .row {
        display: flex;
        justify-content: space-between;
        font-size: 0.88rem;
        padding: 0.45rem 0;
        color: var(--muted);
      }
      .timeline .row.done,
      .timeline .row.current {
        color: var(--text);
      }
      .timeline .row.current {
        font-weight: 700;
      }
      .clock {
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 0.75rem;
        color: var(--muted);
      }
      .hint-box {
        margin-top: 1.1rem;
        border: 1px solid var(--border);
        padding: 0.75rem;
        font-size: 0.8rem;
        color: var(--muted);
        line-height: 1.45;
        border-radius: 4px;
      }
      .hint-live {
        margin-top: 0.75rem;
        font-size: 0.78rem;
        color: var(--muted);
      }
      .banner {
        margin: 0.5rem 0 0.75rem;
        padding: 1rem;
        border-radius: 8px;
        background: var(--accent);
        color: #1a1510;
      }
      .banner-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 800;
      }
      .banner-sub { margin: 0.25rem 0 0; font-weight: 600; }
      .err { color: var(--danger); }
      .muted { color: var(--muted); }
      .primary {
        width: 100%;
        margin-top: 1rem;
        border: none;
        background: var(--text);
        color: var(--bg);
        font-weight: 700;
        padding: 0.85rem;
        border-radius: 4px;
        cursor: pointer;
      }
    `}</style>
  )
}
