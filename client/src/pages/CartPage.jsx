import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useKioskIdleReset } from '../hooks/useKioskIdleReset'
import { createOrder, validateTableSession } from '../services/api'
import ClientTopBar from '../components/ClientTopBar'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import { formatPrice } from '../utils'
import './CartPage.css'

// Tela de revisão do carrinho: lista os itens escolhidos, permite ajustar
// quantidade/remover, e envia o pedido (POST /api/orders) ao confirmar.
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
  const toast = useToast()
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

  // Envia o pedido pro backend (que recalcula os preços de verdade) e, se der
  // certo, esvazia o carrinho e leva o cliente pra tela de pagamento (Pix simulado).
  async function handleCheckout() {
    setBusy(true)
    try {
      const order = await createOrder(toCreatePayload())
      clear()
      const payPath = tableToken
        ? `/mesa/${tableToken}/pagamento/${order.publicId}`
        : `/pagamento/${order.publicId}`
      navigate(payPath)
    } catch (e) {
      toast.error(e, { title: 'Pedido não enviado' })
    } finally {
      setBusy(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="page">
        <ClientTopBar tableLabel={tableLabel} title="Seu pedido" backTo={backPath} />
        <div className="screen-state">
          <span className="state-icon">
            <Icon name="bag" size={28} />
          </span>
          <h2>Seu carrinho está vazio</h2>
          <p>Escolha algo gostoso no cardápio para começar.</p>
          <Link to={backPath} className="btn">
            Ver cardápio
          </Link>
        </div>
      </div>
    )
  }


  return (
    <div className="page cart-page">
      <ClientTopBar tableLabel={tableLabel} title="Seu pedido" backTo={backPath} />

      <div className="cart-head">
        <h1 className="display">Revise seu pedido</h1>
        <span className="muted">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <ul className="cart-lines">
        {lines.map((line) => {
          const addonNames = (line.addons || []).map((a) => `+ ${a.name}`).join(' · ')
          return (
            <li key={line.key} className="cart-line">
              <div className="line-main">
                <div className="line-info">
                  <strong>{line.name}</strong>
                  {addonNames && <span className="line-extra">{addonNames}</span>}
                  {line.notes && (
                    <span className="line-note">
                      <Icon name="message" size={12} /> {line.notes}
                    </span>
                  )}
                </div>
                <span className="line-price">{formatPrice(lineEstimate(line))}</span>
              </div>
              <div className="line-actions">
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Diminuir"
                    onClick={() => updateQuantity(line.key, line.quantity - 1)}
                  >
                    <Icon name={line.quantity <= 1 ? 'trash' : 'minus'} size={15} />
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar"
                    onClick={() => updateQuantity(line.key, line.quantity + 1)}
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
                <button type="button" className="line-remove" onClick={() => removeLine(line.key)}>
                  Remover
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <Link to={backPath} className="add-more">
        <Icon name="plus" size={16} />
        Adicionar mais itens
      </Link>

      <div className="panel summary">
        <div className="summary-row">
          <span className="muted">Subtotal</span>
          <span>{formatPrice(estimateTotal)}</span>
        </div>
        <div className="summary-row total">
          <strong>Total</strong>
          <strong>{formatPrice(estimateTotal)}</strong>
        </div>
        <p className="summary-hint">
          O valor final é confirmado pelo restaurante no envio do pedido.
        </p>
      </div>

      <div className="checkout-bar">
        <button type="button" className="btn btn-block" disabled={busy} onClick={handleCheckout}>
          {busy ? 'Enviando…' : 'Confirmar e pagar'}
          {!busy && <span className="checkout-total">{formatPrice(estimateTotal)}</span>}
        </button>
      </div>
    </div>
  )
}
