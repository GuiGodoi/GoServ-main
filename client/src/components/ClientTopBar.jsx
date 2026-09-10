import React from 'react'
import { fetchRestaurant } from '../services/api'

/**
 * Barra superior do wireframe: nome do estabelecimento + MESA XX em todas as telas do client.
 */
export default function ClientTopBar({ tableLabel, title }) {
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
      <div className="left">
        <strong>{title || name}</strong>
      </div>
      {tableLabel && <div className="mesa">{tableLabel}</div>}
      <style>{`
        .client-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 0.85rem;
        }
        .client-top .left strong {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .client-top .mesa {
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          white-space: nowrap;
        }
      `}</style>
    </header>
  )
}
