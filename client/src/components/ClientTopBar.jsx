import React from 'react'
import { Link } from 'react-router-dom'
import { fetchRestaurant } from '../services/api'
import Icon from './Icon'
import './ClientTopBar.css'

/**
 * Barra superior fixa: nome do estabelecimento (ou título da tela) + mesa.
 * Com "backTo", mostra um botão de voltar à esquerda.
 */
export default function ClientTopBar({ tableLabel, title, backTo }) {
  // "GoServ" é só o valor inicial exibido enquanto o nome real do
  // estabelecimento (vindo da API) ainda não chegou.
  const [name, setName] = React.useState('GoServ')

  React.useEffect(() => {
    let cancelled = false
    fetchRestaurant()
      .then((r) => {
        if (!cancelled && r?.name) setName(r.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <header className="client-top">
      <div className="client-top-inner">
        {backTo ? (
          <Link to={backTo} className="icon-btn" aria-label="Voltar">
            <Icon name="back" size={20} />
          </Link>
        ) : (
          <span className="client-mark" aria-hidden="true">
            <Icon name="utensils" size={17} />
          </span>
        )}
        <strong className="client-title">{title || name}</strong>
        {tableLabel && (
          <span className="table-chip">
            <Icon name="table" size={14} />
            {tableLabel}
          </span>
        )}
      </div>
    </header>
  )
}
