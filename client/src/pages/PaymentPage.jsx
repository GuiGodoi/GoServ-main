import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { confirmPayment, fetchOrder } from '../services/api'
import { connectOrderHub } from '../services/orderHub'
import { useKioskIdleReset } from '../hooks/useKioskIdleReset'
import ClientTopBar from '../components/ClientTopBar'
import { formatPrice, formatCountdown } from '../utils'

export default function PaymentPage() {
  const { orderId: publicId, tableToken } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = React.useState(null)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [tick, setTick] = React.useState(0)

  const menuPath = tableToken ? `/mesa/${tableToken}` : '/'
  const trackPath = tableToken
    ? `/mesa/${tableToken}/pedido/${publicId}`
    : `/pedido/${publicId}`

  useKioskIdleReset(menuPath)

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let connection

    async function boot() {
      try {
        const initial = await fetchOrder(publicId)
        if (cancelled) return
        setOrder(initial)

        if (initial.status !== 'AwaitingPayment') {
          navigate(trackPath, { replace: true })
          return
        }

        connection = connectOrderHub({
          publicId,
          onUpdated: (updated) => {
            if (cancelled) return
            setOrder(updated)
            if (updated.status !== 'AwaitingPayment') {
              navigate(trackPath, { replace: true })
            }
          },
        })
        await connection.start()
        await connection.invoke('WatchOrder', publicId)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Falha ao carregar pagamento')
      }
    }

    boot()
    return () => {
      cancelled = true
      connection?.stop()
    }
  }, [publicId, navigate, trackPath])

  async function copyPix() {
    if (!order?.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(order.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Não foi possível copiar. Selecione o código manualmente.')
    }
  }

  async function simulateWebhook() {
    setBusy(true)
    setError('')
    try {
      const updated = await confirmPayment(publicId)
      setOrder(updated)
      navigate(trackPath, { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  void tick

  if (error && !order) {
    return (
      <div className="page">
        <p className="err">{error}</p>
        <Link to={menuPath}>Voltar ao cardápio</Link>
        <Styles />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <p className="muted">Carregando pagamento…</p>
        <Styles />
      </div>
    )
  }

  const expired =
    order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() < Date.now()

  return (
    <div className="page">
      <ClientTopBar tableLabel={order.tableLabel} title="Pagamento" />

      <div className="center">
        <p className="label">Valor a pagar</p>
        <p className="amount">{formatPrice(order.total)}</p>

        <div className="qr" aria-hidden="true">
          QR CODE PIX
        </div>

        <button type="button" className="ghost" onClick={copyPix}>
          {copied ? 'Código copiado' : 'Copiar código Pix'}
        </button>

        {order.pixCopyPaste && (
          <p className="code">{order.pixCopyPaste}</p>
        )}

        <div className="wait">
          <strong>Aguardando confirmação…</strong>
          <p>
            O pedido é enviado para a cozinha assim que o pagamento for
            confirmado.
          </p>
          <div className="pulse-line" />
        </div>

        <p className="exp">
          {expired
            ? 'Pix expirado'
            : `Expira em ${formatCountdown(order.paymentExpiresAt)}`}
        </p>

        {error && <p className="err">{error}</p>}

        {!expired && (
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={simulateWebhook}
          >
            {busy ? 'Confirmando…' : 'Simular pagamento (demo)'}
          </button>
        )}
      </div>

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
        padding: 1rem 1.15rem 3rem;
      }
      .center { text-align: center; }
      .label {
        margin: 1rem 0 0.15rem;
        font-size: 0.8rem;
        color: var(--muted);
      }
      .amount {
        margin: 0 0 1.1rem;
        font-size: 1.85rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .qr {
        width: 160px;
        height: 160px;
        margin: 0 auto;
        border: 1px solid var(--border);
        background:
          repeating-conic-gradient(var(--border) 0 25%, var(--bg-elevated) 0 50%)
          0 0 / 16px 16px;
        display: grid;
        place-items: center;
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 0.7rem;
        color: var(--muted);
      }
      .ghost {
        margin-top: 0.9rem;
        width: 100%;
        border: 1px solid var(--text);
        background: transparent;
        color: var(--text);
        font-weight: 600;
        padding: 0.75rem;
        border-radius: 8px;
        cursor: pointer;
      }
      .code {
        margin: 0.65rem 0 0;
        font-size: 0.65rem;
        color: var(--muted);
        word-break: break-all;
        text-align: left;
      }
      .wait {
        margin-top: 1.1rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.85rem;
        text-align: left;
      }
      .wait strong { font-size: 0.92rem; }
      .wait p {
        margin: 0.35rem 0 0;
        font-size: 0.8rem;
        color: var(--muted);
        line-height: 1.45;
      }
      .pulse-line {
        margin-top: 0.65rem;
        height: 6px;
        border-radius: 4px;
        background: linear-gradient(90deg, var(--border), var(--accent), var(--border));
        background-size: 200% 100%;
        animation: shimmer 1.4s linear infinite;
      }
      @keyframes shimmer {
        from { background-position: 100% 0; }
        to { background-position: -100% 0; }
      }
      .exp {
        margin: 0.85rem 0 0;
        font-size: 0.8rem;
        color: var(--muted);
      }
      .err { color: var(--danger); text-align: left; }
      .muted { color: var(--muted); }
      .primary {
        width: 100%;
        margin-top: 0.85rem;
        border: none;
        background: var(--accent);
        color: #1a1510;
        font-weight: 700;
        padding: 0.85rem;
        border-radius: 10px;
        cursor: pointer;
      }
      .primary:disabled { opacity: 0.65; }
    `}</style>
  )
}
