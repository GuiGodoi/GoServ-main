// Card de um produto na lista do cardápio (foto, nome, preço e botão de adicionar).
import { formatPrice } from '../utils'
import Icon from './Icon'
import './MenuItemCard.css'

export default function MenuItemCard({ item, onAdd, browseOnly = false }) {
  const unavailable = item.available === false
  // "browseOnly" é usado na navegação livre (sem mesa vinculada): o cliente só
  // pode olhar o cardápio, não adicionar nada ao carrinho.
  const canAdd = Boolean(onAdd) && !unavailable && !browseOnly
  const onPromo = Boolean(item.isOnPromo && item.originalPrice != null)

  // O card inteiro é clicável quando dá para adicionar (alvo de toque maior).
  const Tag = canAdd ? 'button' : 'article'
  const tagProps = canAdd
    ? { type: 'button', onClick: () => onAdd?.(item), 'aria-label': `Adicionar ${item.name}` }
    : {}

  return (
    <Tag className={`menu-card ${unavailable ? 'off' : ''} ${canAdd ? 'can-add' : ''}`} {...tagProps}>
      <div className="info">
        <div className="name">{item.name}</div>
        {(item.description || unavailable) && (
          <p className="desc">
            {unavailable ? 'Indisponível no momento' : item.description}
          </p>
        )}
        <div className="prices">
          {onPromo ? (
            <>
              <span className="price-promo">{formatPrice(item.price)}</span>
              <span className="price-old">{formatPrice(item.originalPrice)}</span>
            </>
          ) : (
            <span className="price">{formatPrice(item.price)}</span>
          )}
        </div>
      </div>

      <div className="media">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt="" loading="lazy" />
        ) : (
          <div className="placeholder" aria-hidden="true">
            {item.name?.[0]}
          </div>
        )}
        {unavailable && <span className="pill pill-muted media-tag">Esgotado</span>}
        {onPromo && !unavailable && (
          <span className="pill pill-promo media-tag">-{item.discountPercent}%</span>
        )}
        {canAdd && (
          <span className="add" aria-hidden="true">
            <Icon name="plus" size={18} />
          </span>
        )}
      </div>
    </Tag>
  )
}
