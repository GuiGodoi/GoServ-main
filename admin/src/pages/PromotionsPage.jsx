import React from 'react'
import { api } from '../services/api'
import { Checkbox, Select, useContentLoading } from '../components/ui'
import { toLocalInput, defaultDateRange, formatMoney, formatDateTime } from '../utils'

const empty = {
  menuItemId: '',
  promoPrice: '',
  startsAt: defaultDateRange().startsAt,
  endsAt: defaultDateRange().endsAt,
  active: true,
}

export default function PromotionsPage() {
  const [promos, setPromos] = React.useState([])
  const [items, setItems] = React.useState([])
  const [form, setForm] = React.useState(empty)
  const [editingId, setEditingId] = React.useState(null)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setError('')
      const [p, menu] = await Promise.all([
        api.getPromotions(),
        api.getMenuItems(),
      ])
      setPromos(p)
      setItems(menu)
    } catch (e) {
      setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const selectedItem = items.find((i) => String(i.id) === String(form.menuItemId))
  const listPrice = selectedItem
    ? Number(selectedItem.originalPrice ?? selectedItem.price)
    : null

  function reset() {
    setEditingId(null)
    setForm({ ...empty, ...defaultDateRange() })
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      menuItemId: String(p.menuItemId),
      promoPrice: String(p.promoPrice),
      startsAt: toLocalInput(p.startsAt),
      endsAt: toLocalInput(p.endsAt),
      active: p.active,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        menuItemId: Number(form.menuItemId),
        promoPrice: Number(form.promoPrice),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        active: form.active,
      }
      if (editingId) {
        const { menuItemId: _, ...update } = payload
        await api.updatePromotion(editingId, update)
      } else {
        await api.createPromotion(payload)
      }
      reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta promoção?')) return
    setBusy(true)
    try {
      await api.deletePromotion(id)
      if (editingId === id) reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const itemOptions = items.map((i) => ({
    value: String(i.id),
    label: `${i.name} · R$ ${Number(i.originalPrice ?? i.price).toFixed(2)}`,
  }))

  return (
    <section className="page">
      <header>
        <h1>Promoções</h1>
        <p>
          Escolha um produto, o preço promocional e o período. O item aparece na
          aba Promoções e na categoria original.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      <form className="panel" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar promoção' : 'Nova promoção'}</h2>
        <div className="grid">
          <Select
            label="Produto"
            required
            value={form.menuItemId}
            options={itemOptions}
            placeholder="Selecione o produto"
            onChange={(v) => setForm({ ...form, menuItemId: v })}
            disabled={Boolean(editingId)}
          />
          <label className="field">
            Preço promocional (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.promoPrice}
              onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
            />
            {listPrice != null && (
              <span className="hint">
                Preço normal: {formatMoney(listPrice)}
              </span>
            )}
          </label>
          <label className="field">
            Início
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </label>
          <label className="field">
            Fim
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </label>
        </div>
        <Checkbox
          label="Promoção ativa"
          checked={form.active}
          onChange={(v) => setForm({ ...form, active: v })}
        />
        <div className="actions">
          <button type="submit" disabled={busy}>
            {editingId ? 'Salvar' : 'Criar promoção'}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={reset}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="panel">
        <h2>Lista ({promos.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preços</th>
              <th>Período</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.menuItemName}{' '}
                  <span className="pct">-{p.discountPercent}%</span>
                </td>
                <td>
                  <s className="old">{formatMoney(p.listPrice)}</s>{' '}
                  <span className="new">{formatMoney(p.promoPrice)}</span>
                </td>
                <td className="muted">
                  {formatDateTime(p.startsAt, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  {' → '}
                  {formatDateTime(p.endsAt, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td>{p.isLive ? 'No ar' : p.active ? 'Agendada/expirada' : 'Inativa'}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => startEdit(p)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(p.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promos.length === 0 && (
          <p className="muted">Nenhuma promoção. Cadastre produtos antes.</p>
        )}
      </div>

      <style>{`
        h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
        header p { margin: 0 0 1.1rem; color: var(--muted); }
        .error { color: var(--danger); }
        .panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
        }
        .panel h2 { margin: 0 0 0.85rem; font-size: 1rem; }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .hint { font-weight: 400; color: var(--muted); font-size: 0.75rem; }
        input {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0.55rem 0.65rem;
          background: #fff;
          font: inherit;
        }
        .actions { display: flex; gap: 0.5rem; margin-top: 0.9rem; }
        .page button {
          border: none;
          background: var(--accent);
          color: #fff;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .page button.ghost {
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .page button.danger {
          background: transparent;
          color: var(--danger);
          border: none;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td {
          text-align: left;
          padding: 0.55rem 0.35rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.88rem;
        }
        th { color: var(--muted); font-weight: 500; }
        .row-actions { text-align: right; white-space: nowrap; }
        .old { color: var(--muted); }
        .new { color: #1f6b4a; font-weight: 700; }
        .pct {
          font-size: 0.7rem;
          font-weight: 700;
          color: #1f6b4a;
          background: rgba(31, 107, 74, 0.12);
          padding: 0.1rem 0.35rem;
          border-radius: 999px;
        }
        .muted { color: var(--muted); }
        @media (max-width: 700px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
