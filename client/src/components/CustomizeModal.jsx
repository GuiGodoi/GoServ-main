// Modal (bottom-sheet) onde o cliente escolhe quantidade, adicionais e
// observações antes de colocar um produto no carrinho.
import React from 'react'
import { fetchAddons } from '../services/api'
import { formatPrice } from '../utils'
import Icon from './Icon'
import { useToast } from './Toast'
import './CustomizeModal.css'

export default function CustomizeModal({ item, tableLabel, onClose, onConfirm }) {
  const [addons, setAddons] = React.useState([])
  const [selected, setSelected] = React.useState({})
  const [quantity, setQuantity] = React.useState(1)
  const [notes, setNotes] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const toast = useToast()

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await fetchAddons(item.id)
        if (!cancelled) setAddons(list)
      } catch (e) {
        if (!cancelled) toast.error(e, { title: 'Não foi possível carregar os adicionais' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [item.id, toast])

  // Só uma estimativa para exibir no botão — o preço final de verdade é
  // sempre recalculado pelo backend quando o pedido é enviado.
  const selectedAddons = addons.filter((a) => selected[a.id])
  const estimate =
    (Number(item.price) +
      selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)) *
    quantity

  // Fecha com Esc e trava a rolagem da página de fundo enquanto o modal está aberto.
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function toggleAddon(id) {

    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleConfirm() {
    onConfirm({
      menuItem: item,
      quantity,
      notes: notes.trim(),
      addons: selectedAddons,
    })
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-scroll">
          <div className={`sheet-hero ${item.photoUrl ? '' : 'no-photo'}`}>
            {item.photoUrl ? (
              <img src={item.photoUrl} alt="" />
            ) : (
              <span className="hero-letter" aria-hidden="true">{item.name?.[0]}</span>
            )}
            <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label="Fechar">
              <Icon name="x" size={20} />
            </button>
            {tableLabel && <span className="table-chip sheet-table">{tableLabel}</span>}
          </div>

          <div className="sheet-content">
            <div className="sheet-title">
              <h2 className="display">{item.name}</h2>
              {item.isOnPromo ? (
                <div className="price-stack">
                  <span className="price-promo">{formatPrice(item.price)}</span>
                  <span className="price-old">{formatPrice(item.originalPrice)}</span>
                </div>
              ) : (
                <strong className="sheet-price">{formatPrice(item.price)}</strong>
              )}
            </div>
            {item.description && <p className="sheet-desc">{item.description}</p>}

            {loading && <p className="muted sheet-loading">Carregando opções…</p>}

            {!loading && addons.length > 0 && (
              <fieldset className="addons">
                <legend>
                  <span>Adicionais</span>
                  <span className="muted">opcional</span>
                </legend>
                {addons.map((addon) => {
                  const on = Boolean(selected[addon.id])
                  return (
                    <label key={addon.id} className={`addon ${on ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleAddon(addon.id)}
                      />
                      <span className="addon-check" aria-hidden="true">
                        <Icon name="check" size={14} />
                      </span>
                      <span className="addon-name">{addon.name}</span>
                      <span className="addon-price">+ {formatPrice(addon.price)}</span>
                    </label>
                  )
                })}
              </fieldset>
            )}

            <label className="field sheet-notes">
              <span>
                <Icon name="message" size={14} /> Alguma observação?
              </span>
              <textarea
                className="input"
                rows={2}
                placeholder="Ex.: sem cebola, ponto da carne…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="sheet-footer">
          <div className="stepper">
            <button
              type="button"
              aria-label="Diminuir"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Icon name="minus" size={16} />
            </button>
            <span>{quantity}</span>
            <button type="button" aria-label="Aumentar" onClick={() => setQuantity((q) => q + 1)}>
              <Icon name="plus" size={16} />
            </button>
          </div>
          <button type="button" className="btn sheet-add" onClick={handleConfirm}>
            <span>Adicionar</span>
            <span>{formatPrice(estimate)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
