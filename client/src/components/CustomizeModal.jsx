import React from 'react'
import { fetchAddons } from '../services/api'
import { formatPrice } from '../utils'

export default function CustomizeModal({ item, tableLabel, onClose, onConfirm }) {
  const [addons, setAddons] = React.useState([])
  const [selected, setSelected] = React.useState({})
  const [quantity, setQuantity] = React.useState(1)
  const [notes, setNotes] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await fetchAddons(item.id)
        if (!cancelled) setAddons(list)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [item.id])

  const selectedAddons = addons.filter((a) => selected[a.id])
  const estimate =
    (Number(item.price) +
      selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)) *
    quantity

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
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="sheet">
        <header>
          <button type="button" className="back" onClick={onClose}>
            ← Voltar
          </button>
          {tableLabel && <span className="mesa">{tableLabel}</span>}
        </header>

        {item.photoUrl ? (
          <div className="hero">
            <img src={item.photoUrl} alt="" />
          </div>
        ) : (
          <div className="hero placeholder">FOTO DO PRATO</div>
        )}

        <div className="title-row">
          <h2>{item.name}</h2>
          {item.isOnPromo ? (
            <div className="price-stack">
              <s>{formatPrice(item.originalPrice)}</s>
              <strong className="promo">{formatPrice(item.price)}</strong>
            </div>
          ) : (
            <strong>{formatPrice(item.price)}</strong>
          )}
        </div>
        {item.description && <p className="desc">{item.description}</p>}

        {loading && <p className="muted">Carregando opções…</p>}
        {error && <p className="err">{error}</p>}

        {!loading && addons.length > 0 && (
          <fieldset>
            <legend>Adicionais</legend>
            {addons.map((addon) => (
              <label key={addon.id} className="check">
                <span>{addon.name}</span>
                <span className="right">
                  + {formatPrice(addon.price)}&nbsp;
                  <input
                    type="checkbox"
                    checked={Boolean(selected[addon.id])}
                    onChange={() => toggleAddon(addon.id)}
                  />
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <label className="block">
          Observação
          <textarea
            rows={2}
            placeholder="Ex.: sem cebola"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="footer-row">
          <div className="qty">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
          <button type="button" className="primary" onClick={handleConfirm}>
            Adicionar · {formatPrice(estimate)}
          </button>
        </div>
      </div>

      <style>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: grid;
          align-items: end;
          z-index: 40;
        }
        .sheet {
          background: var(--bg-elevated);
          border-radius: 12px 12px 0 0;
          padding: 0.85rem 1rem 1.25rem;
          max-height: 90vh;
          overflow: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.65rem;
        }
        .back {
          border: none;
          background: transparent;
          color: var(--text);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .mesa {
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--muted);
        }
        .hero {
          height: 104px;
          border: 1px solid var(--border);
          overflow: hidden;
          margin-bottom: 0.75rem;
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          color: var(--muted);
          font-family: var(--mono, ui-monospace, monospace);
        }
        .hero img { width: 100%; height: 100%; object-fit: cover; }
        .hero.placeholder {
          background: repeating-linear-gradient(
            45deg, var(--border), var(--border) 5px, transparent 5px, transparent 10px
          );
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: baseline;
        }
        .title-row h2 { margin: 0; font-size: 1.05rem; }
        .price-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.1rem;
        }
        .price-stack s {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .price-stack .promo {
          color: #3ecf7a;
          font-size: 1.05rem;
        }
        .desc {
          margin: 0.35rem 0 0;
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.45;
        }
        fieldset { border: none; margin: 1rem 0 0; padding: 0; }
        legend {
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.4rem;
        }
        .check {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.88rem;
          padding: 0.35rem 0;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--muted);
          white-space: nowrap;
        }
        .block {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-top: 0.85rem;
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        textarea {
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 0.55rem;
          font-family: inherit;
          font-size: 0.88rem;
          text-transform: none;
          letter-spacing: normal;
          color: var(--text);
          background: var(--bg);
        }
        .footer-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-top: 1rem;
        }
        .qty {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .qty button {
          width: 28px;
          height: 28px;
          border: 1px solid var(--border);
          background: transparent;
          border-radius: 2px;
          color: var(--text);
          cursor: pointer;
        }
        .primary {
          flex: 1;
          border: none;
          background: var(--text);
          color: var(--bg);
          font-weight: 700;
          padding: 0.7rem 0.85rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .muted { color: var(--muted); font-size: 0.85rem; }
        .err { color: var(--danger); }
      `}</style>
    </div>
  )
}
