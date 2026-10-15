import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchOrder } from '../services/api'
import { connectOrderHub } from '../services/orderHub'
import ClientTopBar from '../components/ClientTopBar'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import { formatPrice, formatClock } from '../utils'
import './OrderStatusPage.css'

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

// Decide se um passo da timeline já passou ("done"), é o atual ("current") ou
// ainda não chegou ("todo"), comparando a posição do passo com o status do pedido.
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

// Tela que o cliente deixa aberta acompanhando o pedido em tempo real (via
// SignalR) depois do pagamento, até ele ficar pronto/entregue/cancelado.
export default function OrderStatusPage() {
  const { orderId: publicId, tableToken } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = React.useState(null)
  const [error, setError] = React.useState('')
  const toast = useToast()
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
      let loaded = false
      try {
        const initial = await fetchOrder(publicId)
        if (cancelled) return
        setOrder(initial)
        loaded = true

        // Essa tela é só para pedido já pago; se ainda estiver aguardando
        // pagamento, manda de volta pra tela de pagamento.
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
        if (cancelled) return
        setLive('offline')
        // Pedido carregou mas o "ao vivo" falhou: mantém a tela e só avisa.
        if (loaded) {
          toast.error('Recarregue a página para ver o status mais recente do pedido.', {
            title: 'Atualização ao vivo indisponível',
          })
        } else {
          setError(e.message || 'Não foi possível acompanhar o pedido')
        }
      }
    }

    boot()
    return () => {
      cancelled = true
      connection?.stop()
    }
  }, [publicId, navigate, payPath, toast])

  // Dispara uma notificação do navegador quando o pedido fica pronto (só uma
  // vez por pedido, controlado pelo "readyAlertSent" — útil se a aba estiver em segundo plano).
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
        <ClientTopBar title="Seu pedido" />
        <div className="screen-state">
          <span className="state-icon">
            <Icon name="alert" size={28} />
          </span>
          <h2>Não foi possível acompanhar</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(menuPath)}>
            Voltar ao cardápio
          </button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <ClientTopBar title="Seu pedido" />
        <p className="muted status-loading">Carregando pedido…</p>
      </div>
    )
  }

  const isReady = order.status === 'Ready'
  const isCancelled = order.status === 'Cancelled'
  const isDone = order.status === 'Delivered' || isCancelled
  const paidAt = formatClock(order.createdAt)

  return (
    <div className={`page status-page ${isReady ? 'ready-mode' : ''}`}>
      <ClientTopBar
        tableLabel={order.tableLabel}
        title={`Pedido #${String(order.id).padStart(4, '0')}`}
      />

      {isReady && (
        <div className="ready-banner" role="status" aria-live="assertive">
          <span className="ready-icon">
            <Icon name="bell" size={24} />
          </span>
          <div>
            <p className="ready-title">Seu pedido está pronto!</p>
            <p className="ready-sub">
              {order.tableLabel ? `Retire na ${order.tableLabel}` : `Senha ${order.id}`}
            </p>
          </div>
        </div>
      )}

      <div className="ticket-card">
        <span className="eyebrow">Sua senha</span>
        <div className="ticket-number display">{order.id}</div>
        <div className="ticket-meta">
          <span>{formatPrice(order.total)}</span>
          <span className={`live-chip ${live}`}>
            <span className="live-dot" />
            {live === 'online' ? 'Ao vivo' : live === 'connecting' ? 'Conectando' : 'Offline'}
          </span>
        </div>
      </div>

      {isCancelled ? (
        <div className="notice notice-error">
          <Icon name="alert" size={16} />
          Este pedido foi cancelado. Fale com um atendente se precisar de ajuda.
        </div>
      ) : (
        <ol className="timeline">
          {TRACK_STEPS.map((step, i) => {
            const state = stepState(order.status, step.key)
            return (
              <li key={step.key} className={`step ${state}`}>
                <span className="step-dot">
                  {state === 'done' && <Icon name="check" size={14} />}
                  {state === 'current' && <span className="step-pulse" />}
                </span>
                <div className="step-body">
                  <span className="step-label">{step.label}</span>
                  {/* Só o horário do pedido é conhecido; os demais passos não têm hora registrada. */}
                  {i === 0 && state !== 'todo' && <span className="step-time">{paidAt}</span>}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {!isDone && !isReady && (
        <div className="notice notice-info">
          <Icon name="bell" size={16} />
          <span>
            Pode deixar esta tela aberta — ela atualiza sozinha e avisa quando o
            pedido ficar pronto
            {STATUS_LABEL[order.status] ? ` (agora: ${STATUS_LABEL[order.status].toLowerCase()})` : ''}.
          </span>
        </div>
      )}

      {isDone && (
        <button type="button" className="btn btn-block new-order" onClick={() => navigate(menuPath)}>
          Fazer novo pedido
        </button>
      )}
    </div>
  )
}
