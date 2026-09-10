import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useKioskIdleReset } from '../hooks/useKioskIdleReset'
import { createOrder, validateTableSession } from '../services/api'
import ClientTopBar from '../components/ClientTopBar'
import { formatPrice } from '../utils'

export default function CartPage() {
  const { tableToken } = useParams()
  const navigate = useNavigate()
  const {
    lines,
    estimateTotal,
    lineEstimate,
    updateQuantity,
    removeLine,
    toCreatePayload,
    clear,
    itemCount,
  } = useCart()

  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [tableLabel, setTableLabel] = React.useState('')

  const backPath = tableToken ? `/mesa/${tableToken}` : '/'
  useKioskIdleReset(backPath)

  React.useEffect(() => {
    if (!tableToken) return
    let cancelled = false
    validateTableSession(tableToken)
      .then((s) => {
        if (!cancelled) setTableLabel(s.tableLabel || '')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [tableToken])

  async function handleCheckout() {
    setBusy(true)
    setError('')
    try {
      const order = await createOrder(toCreatePayload())
      clear()
      const payPath = tableToken
        ? `/mesa/${tableToken}/pagamento/${order.publicId}`
        : `/pagamento/${order.publicId}`
      navigate(payPath)
    } catch (e) {
      setError(e.message || 'Falha ao enviar pedido')
    } finally {
      setBusy(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="page">
        <ClientTopBar tableLabel={tableLabel} title="Seu pedido" />
        <p className="muted">Carrinho vazio. Adicione itens do cardápio.</p>
        <Link to={backPath} className="ghost">
          Continuar escolhendo
        </Link>
        <PageStyles />
      </div>
    )
  }

  return (
    <div className="page">
      <ClientTopBar tableLabel={tableLabel} title="Seu pedido" />

      <ul className="lines">
        {lines.map((line) => {
          const addonNames = (line.addons || []).map((a) => `+ ${a.name}`).join(' · ')
          const obsBits = [line.notes, addonNames].filter(Boolean).join(' · ')
          return (
            <li key={line.key}>
              <div className="row">
                <div className="info">
                  <strong>{line.name}</strong>
                  {obsBits && <div className="obs">{obsBits}</div>}
                  <div className="stepper">
                    <button type="button" onClick={() => updateQuantity(line.key, line.quantity - 1)}>
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(line.key, line.quantity + 1)}>
                      +
                    </button>
                    <button type="button" className="remove" onClick={() => removeLine(line.key)}>
                      Remover
                    </button>
                  </div>
                </div>
                <div className="price">{formatPrice(lineEstimate(line))}</div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="total-row">
        <strong>Total</strong>
        <strong>{formatPrice(estimateTotal)}</strong>
      </div>
      <p className="hint">
        Valor calculado no servidor no momento da confirmação.
      </p>

      {error && <p className="err">{error}</p>}

      <button type="button" className="primary" disabled={busy} onClick={handleCheckout}>
        {busy ? 'Enviando…' : 'Confirmar e pagar'}
      </button>
      <Link to={backPath} className="ghost">
        Continuar escolhendo
      </Link>

      <PageStyles />
    </div>
  )
}

function PageStyles() {
  return (
    <style>{`
      .page {
        max-width: 480px;
        margin: 0 auto;
        padding: 0.75rem 1.15rem 3rem;
      }
      .lines {
        list-style: none;
        margin: 0 0 0.5rem;
        padding: 0;
      }
      .lines li {
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border);
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .info { flex: 1; min-width: 0; }
      .info strong { font-size: 0.95rem; }
      .obs {
        display: inline-block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        background: var(--bg-elevated);
        padding: 0.1rem 0.4rem;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-top: 0.4rem;
        font-size: 0.85rem;
      }
      .stepper button {
        width: 22px;
        height: 22px;
        border: 1px solid var(--border);
        background: transparent;
        border-radius: 2px;
        cursor: pointer;
        color: var(--text);
      }
      .stepper .remove {
        width: auto;
        border: none;
        color: var(--muted);
        margin-left: 0.35rem;
      }
      .price { font-weight: 600; font-size: 0.92rem; }
      .total-row {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--border);
        padding-top: 0.85rem;
        margin-top: 0.35rem;
        font-size: 1.05rem;
      }
      .hint, .muted {
        color: var(--muted);
        font-size: 0.78rem;
        margin: 0.4rem 0 0.9rem;
      }
      .err { color: var(--danger); }
      .primary {
        width: 100%;
        border: none;
        background: var(--text);
        color: var(--bg);
        font-weight: 700;
        padding: 0.8rem;
        border-radius: 4px;
        cursor: pointer;
      }
      .primary:disabled { opacity: 0.65; }
      .ghost {
        display: block;
        margin-top: 0.55rem;
        text-align: center;
        text-decoration: none;
        color: var(--text);
        border: 1px solid var(--text);
        padding: 0.75rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.9rem;
      }
    `}</style>
  )
}
