import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../utils'

export default function CartBar({ tableToken }) {
  const { itemCount, estimateTotal } = useCart()
  if (itemCount === 0) return null

  const cartPath = tableToken ? `/mesa/${tableToken}/carrinho` : '/carrinho'

  return (
    <div className="cart-bar">
      <div className="inner">
        <div>
          <div className="c">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </div>
          <div className="v">{formatPrice(estimateTotal)}</div>
        </div>
        <Link to={cartPath} className="btn">
          Ver pedido
        </Link>
      </div>

      <style>{`
        .cart-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
          z-index: 30;
          padding: 0.7rem 1rem 0.9rem;
        }
        .inner {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        .c { font-size: 0.75rem; color: var(--muted); }
        .v { font-size: 1rem; font-weight: 700; }
        .btn {
          flex: 1;
          max-width: 200px;
          text-align: center;
          text-decoration: none;
          background: var(--text);
          color: var(--bg);
          font-weight: 700;
          font-size: 0.9rem;
          padding: 0.7rem 0.9rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
