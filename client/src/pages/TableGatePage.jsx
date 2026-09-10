import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPublicTable, joinTable } from '../services/api'
import ClientTopBar from '../components/ClientTopBar'

export default function TableGatePage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = React.useState(null)
  const [guestName, setGuestName] = React.useState('')
  const [dayPasscode, setDayPasscode] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchPublicTable(tableId)
        if (!cancelled) setTable(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Mesa não encontrada')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tableId])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await joinTable(tableId, {
        guestName,
        dayPasscode,
      })
      try {
        sessionStorage.setItem(
          `goserv_guest_${session.diningTableId}`,
          JSON.stringify({ guestName: session.guestName, token: session.accessToken })
        )
      } catch {
        /* ignore */
      }
      navigate(`/mesa/${session.accessToken}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Não foi possível liberar a mesa')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate-page">
      <ClientTopBar tableLabel={table?.label} title={table?.restaurantName || 'GoServ'} />

      {loading && <p className="muted">Carregando mesa…</p>}
      {!loading && table && (
        <>
          <h1>Entrar na {table.label}</h1>
          <p className="lead">
            Informe seu nome e a <strong>senha do dia</strong> fornecida pelos
            funcionários para fazer pedidos nesta mesa.
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              Seu nome
              <input
                required
                autoComplete="name"
                maxLength={80}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ex.: Ana"
              />
            </label>
            <label>
              Senha do dia
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                value={dayPasscode}
                onChange={(e) => setDayPasscode(e.target.value)}
                placeholder="6 dígitos"
              />
            </label>
            {error && <p className="err">{error}</p>}
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Validando…' : 'Acessar cardápio'}
            </button>
          </form>

          <p className="hint">
            Só quer consultar o cardápio?{' '}
            <a href="/cardapio">Abrir cardápio sem pedidos</a>
          </p>
        </>
      )}

      {!loading && !table && error && <p className="err">{error}</p>}

      <style>{`
        .gate-page {
          max-width: 420px;
          margin: 0 auto;
          padding: 0.75rem 1.1rem 2.5rem;
        }
        h1 {
          margin: 0.5rem 0 0.35rem;
          font-size: clamp(1.35rem, 5vw, 1.7rem);
          font-family: var(--display);
        }
        .lead {
          color: var(--muted);
          font-size: 0.92rem;
          line-height: 1.45;
          margin: 0 0 1.1rem;
        }
        form {
          display: grid;
          gap: 0.85rem;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
        }
        input {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-elevated);
          color: var(--text);
          padding: 0.75rem 0.85rem;
          font-size: 1rem;
        }
        .primary {
          border: none;
          background: var(--accent);
          color: #1a1510;
          font-weight: 700;
          padding: 0.9rem;
          border-radius: 12px;
          cursor: pointer;
          min-height: 48px;
        }
        .primary:disabled { opacity: 0.65; }
        .err { color: var(--danger); margin: 0; }
        .muted, .hint { color: var(--muted); font-size: 0.85rem; }
        .hint a { color: var(--accent); }
        .hint { margin-top: 1.25rem; }
      `}</style>
    </div>
  )
}
