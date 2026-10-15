import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPublicTable, joinTable } from '../services/api'
import ClientTopBar from '../components/ClientTopBar'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import './TableGatePage.css'


// Tela que abre ao escanear o QR code da mesa: pede nome + senha do dia para
// liberar a mesa (POST /api/tables/:id/join) antes de ir para o cardápio.
export default function TableGatePage() {
  const { tableId } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = React.useState(null)
  const [guestName, setGuestName] = React.useState('')
  const [dayPasscode, setDayPasscode] = React.useState('')
  const [error, setError] = React.useState('')
  const toast = useToast()
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
    try {
      const session = await joinTable(tableId, {
        guestName,
        dayPasscode,
      })
      // Guarda uma cópia local (só de conveniência) do nome/token da sessão;
      // se falhar (ex: navegador privado bloqueando sessionStorage), não é grave.
      try {
        sessionStorage.setItem(
          `goserv_guest_${session.diningTableId}`,
          JSON.stringify({ guestName: session.guestName, token: session.accessToken })
        )
      } catch {
        /* ignore */
      }
      // O token da sessão vira a própria URL do cardápio ("/mesa/:token"),
      // é ele que identifica a mesa em todas as chamadas seguintes.
      navigate(`/mesa/${session.accessToken}`, { replace: true })
    } catch (err) {
      toast.error(err, { title: 'Não foi possível entrar na mesa' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page gate-page">
      <ClientTopBar title={table?.restaurantName || 'GoServ'} />

      {loading && <p className="muted gate-loading">Carregando mesa…</p>}

      {!loading && table && (
        <div className="gate">
          <div className="gate-badge">
            <Icon name="table" size={30} />
          </div>
          <span className="eyebrow">Bem-vindo</span>
          <h1 className="display">{table.label}</h1>
          <p className="lead">
            Informe seu nome e a <strong>senha do dia</strong> (peça a um
            atendente) para fazer pedidos nesta mesa.
          </p>

          <form className="panel gate-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Seu nome</span>
              <input
                className="input"
                required
                autoComplete="name"
                maxLength={80}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Como podemos te chamar?"
              />
            </label>
            <label className="field">
              <span>Senha do dia</span>
              <input
                className="input passcode-input"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                value={dayPasscode}
                onChange={(e) => setDayPasscode(e.target.value)}
                placeholder="••••••"
              />
            </label>
            <button type="submit" className="btn btn-block" disabled={busy}>
              {busy ? 'Validando…' : 'Acessar cardápio'}
              {!busy && <Icon name="arrowRight" size={18} />}
            </button>
          </form>

          <a href="/cardapio" className="gate-browse">
            <Icon name="eye" size={16} />
            Só quero ver o cardápio
          </a>
        </div>
      )}

      {!loading && !table && error && (
        <div className="screen-state">
          <span className="state-icon">
            <Icon name="alert" size={28} />
          </span>
          <h2>Mesa não encontrada</h2>
          <p>{error}</p>
          <a href="/cardapio" className="btn btn-secondary">Ver cardápio</a>
        </div>
      )}
    </div>
  )
}
