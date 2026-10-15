import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../auth/AuthContext'
import {
  Alert,
  EmptyState,
  Icon,
  PageHeader,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'
import { formatMoney, formatDateTime } from '../utils'
import './TablesPage.css'

// Cadastro de mesas + gestão manual das sessões (abrir/fechar sessão pela
// equipe, sem passar pelo fluxo normal de QR + senha do dia).
export default function TablesPage() {
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const [tables, setTables] = React.useState([])
  const [label, setLabel] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [lastLink, setLastLink] = React.useState('')
  const [booting, setBooting] = React.useState(true)
  const dialog = useDialog()
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setTables(await api.getTables())
    } catch (e) {
      toast.error(e)
    } finally {
      setBooting(false)
    }
  }, [toast])

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
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function openSession(id) {
    setBusy(true)
    try {
      const session = await api.openTableSession(id)
      // O admin roda na porta 5174 e o client (cardápio) na 5173; troca a
      // porta na URL atual só para montar um link de teste clicável.
      const full = `${window.location.origin.replace('5174', '5173')}${session.clientPath}`
      setLastLink(full)
      await load()
    } catch (err) {
      toast.error(err)
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
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  // Abre um diálogo rápido (em vez de um formulário) para liberar um teto de
  // gastos maior numa sessão que já bateu no limite.
  async function raiseCap(table) {
    const current = table.activeSession?.spendingCap ?? 500
    const raw = await dialog.prompt({
      title: `Liberar teto · ${table.label}`,
      message: `Teto atual: ${formatMoney(current)}. Informe o novo valor máximo de consumo da sessão.`,
      inputLabel: 'Novo teto (R$)',
      inputMode: 'decimal',
      icon: 'wallet',
      defaultValue: String(Number(current) + 200),
      confirmLabel: 'Liberar',
    })

    if (raw == null) return
    const value = Number(raw.replace(',', '.'))
    if (Number.isNaN(value) || value < 0) {
      toast.error('Informe um número maior ou igual a zero.', { title: 'Valor inválido' })
      return
    }
    setBusy(true)
    try {
      await api.raiseSessionCap(table.id, value)
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  const openCount = tables.filter((t) => t.activeSession).length

  return (
    <section className="page">
      <PageHeader
        title="Mesas"
        description={
          <>
            Cadastre mesas e acompanhe as sessões abertas. Os QR codes fixos ficam
            em <Link to="/qrcodes">QR Codes</Link> (entrada com nome + senha do dia).
          </>
        }
      />

      {lastLink && (
        <Alert tone="success" onClose={() => setLastLink('')}>
          Sessão aberta. Link do cliente:{' '}
          <a href={lastLink} target="_blank" rel="noreferrer">
            {lastLink}
          </a>
        </Alert>
      )}

      <div className="card">
        <div className="card-header tables-header">
          <h2>
            Mesas <span className="count">{tables.length}</span>
            {openCount > 0 && <span className="badge success">{openCount} {openCount === 1 ? 'aberta' : 'abertas'}</span>}
          </h2>
          {/* Só o Admin pode cadastrar mesas (POST /tables); a Cozinha só gerencia sessões. */}
          {isAdmin && (
            <form className="inline-form" onSubmit={handleCreate}>
              <input
                className="input"
                required
                placeholder="Ex.: Mesa 5"
                aria-label="Identificador da nova mesa"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <button type="submit" className="btn" disabled={busy}>
                <Icon name="plus" size={16} />
                Adicionar
              </button>
            </form>
          )}
        </div>

        {tables.length === 0 ? (
          <EmptyState icon="table" title="Nenhuma mesa cadastrada">
            {isAdmin
              ? 'Adicione a primeira mesa no campo acima.'
              : 'Peça a um administrador para cadastrar as mesas.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Status</th>
                  <th>Consumo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => {
                  const s = table.activeSession
                  const pct = s && s.spendingCap > 0
                    ? Math.min(100, (Number(s.spent) / Number(s.spendingCap)) * 100)
                    : 0
                  return (
                    <tr key={table.id}>
                      <td>
                        <div className="with-thumb">
                          <span className={`thumb table-icon ${s ? 'on' : ''}`}>
                            <Icon name="table" size={18} />
                          </span>
                          <strong>{table.label}</strong>
                        </div>
                      </td>
                      <td>
                        {s ? (
                          <>
                            <span className="badge success">Aberta</span>
                            <span className="sub">até {formatDateTime(s.expiresAt)}</span>
                          </>
                        ) : (
                          <span className="badge">Livre</span>
                        )}
                      </td>
                      <td>
                        {s ? (
                          <div className="spend">
                            <div className="spend-line">
                              <span className="num">
                                <strong>{formatMoney(s.spent)}</strong>
                                <span className="muted"> / {formatMoney(s.spendingCap)}</span>
                              </span>
                              <span className="muted">
                                {s.orderCount} {s.orderCount === 1 ? 'pedido' : 'pedidos'}
                              </span>
                            </div>
                            <div className={`meter ${pct >= 90 ? 'hot' : pct >= 70 ? 'warm' : ''}`}>
                              <i style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="row-actions">
                          {s && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={busy}
                                onClick={() => raiseCap(table)}
                              >
                                Liberar teto
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={busy}
                                onClick={() => closeSession(table.id)}
                              >
                                Fechar
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => openSession(table.id)}
                          >
                            Abrir sessão
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
