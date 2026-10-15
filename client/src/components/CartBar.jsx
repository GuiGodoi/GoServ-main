// Barra flutuante no rodapé do cardápio com o resumo do carrinho (some se estiver vazio).
import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../utils'
import Icon from './Icon'
import './CartBar.css'

export default function CartBar({ tableToken }) {
  const { itemCount, estimateTotal } = useCart()
  if (itemCount === 0) return null

  const cartPath = tableToken ? `/mesa/${tableToken}/carrinho` : '/carrinho'

  return (
    <div className="cart-bar">
      <Link to={cartPath} className="cart-cta">
        <span className="cart-icon">
          <Icon name="bag" size={18} />
          <span className="cart-count" key={itemCount}>{itemCount}</span>
        </span>
        <span className="cart-label">Ver pedido</span>
        <span className="cart-total">{formatPrice(estimateTotal)}</span>
      </Link>
    </div>
  )
}
