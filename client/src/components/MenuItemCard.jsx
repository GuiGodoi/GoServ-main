import { formatPrice } from '../utils'

export default function MenuItemCard({ item, onAdd, browseOnly = false }) {
  const unavailable = item.available === false
  const canAdd = Boolean(onAdd) && !unavailable && !browseOnly
  const onPromo = Boolean(item.isOnPromo && item.originalPrice != null)

  return (
    <article className={`menu-card ${unavailable ? 'off' : ''}`}>
      <div className="media">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="placeholder" aria-hidden="true">
            FOTO
          </div>
        )}
      </div>
      <div className="info">
        <div className="n">
          {item.name}
          {unavailable && <span className="tag">ESGOTADO</span>}
          {onPromo && !unavailable && (
            <span className="pill">-{item.discountPercent}%</span>
          )}
        </div>
        {item.description && (
          <div className="d">
            {unavailable ? 'Indisponível no momento' : item.description}
          </div>
        )}
        <div className="prices">
          {onPromo ? (
            <>
              <s className="old">{formatPrice(item.originalPrice)}</s>
              <span className="promo">{formatPrice(item.price)}</span>
            </>
          ) : (
            <span className="p">{formatPrice(item.price)}</span>
          )}
        </div>
      </div>
      {canAdd ? (
        <button
          type="button"
          className="plus"
          aria-label={`Adicionar ${item.name}`}
          onClick={() => onAdd?.(item)}
        >
          +
        </button>
      ) : (
        <span className="plus ghost" aria-hidden="true" />
      )}

      <style>{`
        .menu-card {
          display: flex;
          gap: 0.65rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--border);
          align-items: stretch;
        }
        .menu-card.off { opacity: 0.45; }
        .media {
          width: 52px;
          height: 52px;
          flex: none;
          border: 1px solid var(--border);
          border-radius: 2px;
          overflow: hidden;
          background: var(--bg-elevated);
        }
        .media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 0.55rem;
          color: var(--muted);
          font-family: var(--mono, ui-monospace, monospace);
          background:
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 6px,
              rgba(255,255,255,0.04) 6px,
              rgba(255,255,255,0.04) 12px
            );
        }
        .info { flex: 1; min-width: 0; }
        .n {
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          align-items: center;
        }
        .tag {
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 0.6rem;
          border: 1px solid var(--muted);
          color: var(--muted);
          padding: 0.05rem 0.3rem;
          border-radius: 2px;
        }
        .pill {
          font-size: 0.65rem;
          font-weight: 700;
          color: #1f6b4a;
          background: rgba(46, 160, 90, 0.18);
          padding: 0.12rem 0.4rem;
          border-radius: 999px;
        }
        .d {
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.35;
          margin-top: 0.15rem;
        }
        .prices {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
          margin-top: 0.3rem;
          flex-wrap: wrap;
        }
        .p { font-size: 0.92rem; font-weight: 600; }
        .old {
          font-size: 0.8rem;
          color: var(--muted);
          text-decoration: line-through;
        }
        .promo {
          font-size: 0.95rem;
          font-weight: 700;
          color: #3ecf7a;
        }
        .plus {
          width: 36px;
          height: 36px;
          flex: none;
          align-self: center;
          border: 1px solid var(--text);
          border-radius: 2px;
          background: transparent;
          color: var(--text);
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
        }
        .plus.ghost {
          border-color: transparent;
          visibility: hidden;
        }
        @media (max-width: 480px) {
          .plus { width: 40px; height: 40px; }
        }
      `}</style>
    </article>
  )
}
