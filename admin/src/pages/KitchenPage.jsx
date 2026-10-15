import React from 'react'
import { api } from '../services/api'
import { connectKitchenHub } from '../services/kitchenHub'
import {
  Icon,
  PageHeader,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'
import { elapsedLabel } from '../utils'
import './KitchenPage.css'

// Cada coluna do quadro (kanban) representa um status do pedido, na ordem em
// que ele avança; "next" é para qual status o botão da coluna deve mandar o pedido.
const COLUMNS = [
  { status: 'Received', title: 'Recebido', next: 'Preparing', nextLabel: 'Iniciar preparo' },
  { status: 'Preparing', title: 'Em preparo', next: 'Ready', nextLabel: 'Marcar como pronto' },
  { status: 'Ready', title: 'Pronto', next: 'Delivered', nextLabel: 'Confirmar entrega' },
]

// Painel da cozinha (KDS): quadro em tempo real com os pedidos pagos, um
// clique avança o status de cada um. Atualiza sozinho via SignalR.
export default function KitchenPage() {
  const toast = useToast()
  const [orders, setOrders] = React.useState([])
  const [live, setLive] = React.useState('connecting')
  const [busyId, setBusyId] = React.useState(null)
  const [booting, setBooting] = React.useState(true)
  const [, setTick] = React.useState(0)
  const [restaurantName, setRestaurantName] = React.useState('')
  const dialog = useDialog()
  useContentLoading(booting)

  React.useEffect(() => {
    let cancelled = false
    api
      .getRestaurant()
      .then((r) => !cancelled && setRestaurantName(r?.name || ''))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Força um re-render a cada 30s só para o "tempo decorrido" (elapsedLabel)
  // de cada ficha continuar contando, mesmo sem nenhum pedido novo chegando.
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // Insere/atualiza um pedido na lista local. Se ele virou Delivered/Cancelled,
  // some do quadro (não faz mais sentido ficar visível na cozinha).
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
          toast.error(e)
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
  }, [upsertOrder, toast])

  async function advance(order, nextStatus) {
    setBusyId(order.id)
    try {
      const updated = await api.updateOrderStatus(order.id, nextStatus)
      upsertOrder(updated)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusyId(null)
    }
  }

  async function cancel(order) {
    const ok = await dialog.confirm({
      title: `Cancelar pedido #${String(order.id).padStart(4, '0')}?`,
      message: `${order.tableLabel || 'Sem mesa'} · o pedido sai do quadro da cozinha.`,
      confirmLabel: 'Cancelar pedido',
      cancelLabel: 'Voltar',
      tone: 'danger',
    })
    if (!ok) return

    setBusyId(order.id)
    try {
      const updated = await api.updateOrderStatus(order.id, 'Cancelled')
      upsertOrder(updated)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const liveLabel =
    live === 'online' ? 'Ao vivo' : live === 'connecting' ? 'Conectando…' : 'Offline'

  return (
    <section className="kitchen">
      <PageHeader
        title="Cozinha"
        description={`${restaurantName ? `${restaurantName} · ` : ''}${orders.length} ${
          orders.length === 1 ? 'pedido aberto' : 'pedidos abertos'
        }`}
        actions={
          <span className={`live-pill ${live}`}>
            <span className="live-dot" />
            {liveLabel}
          </span>
        }
      />

      <div className="board">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status)
          return (
            <div key={col.status} className={`lane lane-${col.status.toLowerCase()}`}>
              <header className="lane-head">
                <span className="lane-dot" />
                <h2>{col.title}</h2>
                <span className="lane-count">{columnOrders.length}</span>
              </header>
              <div className="lane-body">
                {columnOrders.length === 0 && (
                  <div className="lane-empty">
                    <Icon name="inbox" size={20} />
                    Nenhum pedido
                  </div>
                )}
                {columnOrders.map((order) => {
                  const mins = minutesSince(order.createdAt)
                  const age = mins >= 20 ? 'late' : mins >= 10 ? 'slow' : ''
                  return (
                    <article key={order.id} className={`ticket ${age}`}>
                      <div className="ticket-head">
                        <span className="ticket-no">#{String(order.id).padStart(4, '0')}</span>
                        <span className="ticket-table">{order.tableLabel || 'Sem mesa'}</span>
                        <span className="ticket-clock">
                          <Icon name="clock" size={13} />
                          {elapsedLabel(order.createdAt)}
                        </span>
                      </div>
                      <ul className="ticket-items">
                        {order.items.map((item) => {
                          const bits = [
                            item.notes,
                            ...(item.addons || []).map((a) => `+ ${a.name}`),
                          ].filter(Boolean)
                          return (
                            <li key={item.id}>
                              <span className="qty">{item.quantity}×</span>
                              <div>
                                <strong>{item.menuItemName}</strong>
                                {bits.length > 0 && (
                                  <span className="obs">{bits.join(' · ')}</span>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                      {order.customerNotes && (
                        <p className="ticket-note">
                          <strong>Obs.:</strong> {order.customerNotes}
                        </p>
                      )}
                      <div className="ticket-actions">
                        {col.status === 'Received' && (
                          <button
                            type="button"
                            className="icon-btn danger"
                            title="Cancelar pedido"
                            aria-label={`Cancelar pedido ${order.id}`}
                            disabled={busyId === order.id}
                            onClick={() => cancel(order)}
                          >
                            <Icon name="x" size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm advance ${col.status === 'Ready' ? 'btn-secondary' : ''}`}
                          disabled={busyId === order.id}
                          onClick={() => advance(order, col.next)}
                        >
                          {col.nextLabel}
                          <Icon name={col.status === 'Ready' ? 'check' : 'arrowRight'} size={14} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function minutesSince(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}
