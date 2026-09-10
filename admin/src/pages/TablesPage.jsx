import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useContentLoading } from '../components/ui'
import { formatMoney, formatDateTime } from '../utils'

export default function TablesPage() {
  const [tables, setTables] = React.useState([])
  const [label, setLabel] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [lastLink, setLastLink] = React.useState('')
  const [booting, setBooting] = React.useState(true)
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setError('')
      setTables(await api.getTables())
    } catch (e) {
      setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createTable({ label })
      setLabel('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function openSession(id) {
    setBusy(true)
    try {
      const session = await api.openTableSession(id)
      const full = `${window.location.origin.replace('5174', '5173')}${session.clientPath}`
      setLastLink(full)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function closeSession(id) {
    setBusy(true)
    try {
      await api.closeTableSession(id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function raiseCap(table) {
    const current = table.activeSession?.spendingCap ?? 500
    const raw = prompt(
      `Novo teto de gastos para ${table.label} (atual R$ ${Number(current).toFixed(2)}):`,
      String(Number(current) + 200)
    )
    if (raw == null) return
    const value = Number(raw.replace(',', '.'))
    if (Number.isNaN(value) || value < 0) {
      setError('Valor inválido')
      return
    }
    setBusy(true)
    try {
      await api.raiseSessionCap(table.id, value)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <header>
        <h1>Mesas</h1>
        <p>
          Cadastre mesas aqui. Os QR codes fixos ficam em{' '}
          <Link to="/qrcodes">QR Codes</Link> (entrada com nome + senha do dia).
        </p>
      </header>

      {error && <p className="error">{error}</p>}
      {lastLink && (
        <p className="link-box">
          Link do cliente:{' '}
          <a href={lastLink} target="_blank" rel="noreferrer">
            {lastLink}
          </a>
        </p>
      )}

      <form className="panel" onSubmit={handleCreate}>
        <h2>Nova mesa</h2>
        <label>
          Identificador
          <input
            required
            placeholder="Mesa 5"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          Cadastrar
        </button>
      </form>

      <div className="panel">
        <h2>Lista</h2>
        <table>
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Sessão / consumo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id}>
                <td>{table.label}</td>
                <td>
                  {table.activeSession ? (
                    <span className="on">
                      Aberta até{' '}
                      {formatDateTime(table.activeSession.expiresAt)}
                      <br />
                      {formatMoney(table.activeSession.spent)} /{' '}
                      {formatMoney(table.activeSession.spendingCap)} ·{' '}
                      {table.activeSession.orderCount} pedidos
                    </span>
                  ) : (
                    <span className="off">Fechada</span>
                  )}
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openSession(table.id)}
                  >
                    Abrir sessão
                  </button>
                  {table.activeSession && (
                    <>
                      <button
                        type="button"
                        className="ghost"
                        disabled={busy}
                        onClick={() => raiseCap(table)}
                      >
                        Liberar teto
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        disabled={busy}
                        onClick={() => closeSession(table.id)}
                      >
                        Fechar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .page h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
        .page > header p { margin: 0 0 1.25rem; color: var(--muted); }
        .error { color: var(--danger); }
        .link-box {
          background: rgba(31, 107, 74, 0.1);
          border: 1px solid rgba(31, 107, 74, 0.25);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          word-break: break-all;
          font-size: 0.9rem;
        }
        .link-box a { color: var(--accent); font-weight: 600; }
        .panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
        }
        .panel h2 { margin: 0 0 0.85rem; font-size: 1rem; }
        label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
          font-weight: 500;
        }
        input {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0.55rem 0.65rem;
          background: #fff;
          max-width: 280px;
        }
        .page button {
          border: none;
          background: var(--accent);
          color: #fff;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .page button:disabled { opacity: 0.6; }
        .page button.ghost {
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--line);
        }
        table { width: 100%; border-collapse: collapse; }
        th, td {
          text-align: left;
          padding: 0.55rem 0.35rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.9rem;
        }
        th { color: var(--muted); font-weight: 500; }
        .row-actions { text-align: right; white-space: nowrap; display: flex; gap: 0.4rem; justify-content: flex-end; }
        .on { color: var(--accent); font-weight: 500; font-size: 0.85rem; }
        .off { color: var(--muted); font-size: 0.85rem; }
      `}</style>
    </section>
  )
}
