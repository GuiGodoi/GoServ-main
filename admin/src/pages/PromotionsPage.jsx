import React from 'react'
import { api } from '../services/api'
import {
  Checkbox,
  EmptyState,
  Icon,
  PageHeader,
  Select,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'
import { toLocalInput, defaultDateRange, formatMoney, formatDateTime } from '../utils'

const empty = {
  menuItemId: '',
  promoPrice: '',
  startsAt: defaultDateRange().startsAt,
  endsAt: defaultDateRange().endsAt,
  active: true,
}

// CRUD de promoções: formulário (cria ou edita) + tabela com o desconto e o
// status (no ar / agendada-expirada / inativa) de cada promoção.
export default function PromotionsPage() {
  const toast = useToast()
  const [promos, setPromos] = React.useState([])
  const [items, setItems] = React.useState([])
  const [form, setForm] = React.useState(empty)
  const [editingId, setEditingId] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  const formRef = React.useRef(null)
  const dialog = useDialog()
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      const [p, menu] = await Promise.all([
        api.getPromotions(),
        api.getMenuItems(),
      ])
      setPromos(p)
      setItems(menu)
    } catch (e) {
      toast.error(e)
    } finally {
      setBooting(false)
    }
  }, [toast])

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
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        menuItemId: Number(form.menuItemId),
        promoPrice: Number(form.promoPrice),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        active: form.active,
      }
      if (editingId) {
        // A API de edição não permite trocar o produto da promoção (só criar
        // uma nova para outro produto), então o menuItemId é descartado aqui.
        const { menuItemId: _, ...update } = payload
        await api.updatePromotion(editingId, update)
      } else {
        await api.createPromotion(payload)
      }
      reset()
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(promo) {
    const id = promo.id
    const ok = await dialog.confirm({
      title: 'Excluir promoção?',
      message: `A promoção de ${promo.menuItemName} será removida.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return

    setBusy(true)
    try {
      await api.deletePromotion(id)
      if (editingId === id) reset()
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  const itemOptions = items.map((i) => ({
    value: String(i.id),
    label: `${i.name} · R$ ${Number(i.originalPrice ?? i.price).toFixed(2)}`,
  }))

  const promoValue = Number(form.promoPrice)
  const previewPct =
    listPrice && form.promoPrice !== '' && promoValue < listPrice
      ? Math.round((1 - promoValue / listPrice) * 100)
      : null

  return (
    <section className="page">
      <PageHeader
        title="Promoções"
        description="Escolha um produto, o preço promocional e o período. O item aparece na aba Promoções e na categoria original."
      />

      <form className="card" onSubmit={handleSubmit} ref={formRef}>
        <div className="card-header">
          <h2>
            <Icon name={editingId ? 'edit' : 'tag'} />
            {editingId ? 'Editar promoção' : 'Nova promoção'}
          </h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
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
              <span>Preço promocional</span>
              <div className="input-group">
                <span className="prefix">R$</span>
                <input
                  className="input"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.promoPrice}
                  onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                />
              </div>
              {listPrice != null && (
                <span className="hint">
                  Preço normal: {formatMoney(listPrice)}
                  {previewPct != null && (
                    <> · <strong className="discount">{previewPct}% de desconto</strong></>
                  )}
                </span>
              )}
            </label>
            <label className="field">
              <span>Início</span>
              <input
                className="input"
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Fim</span>
              <input
                className="input"
                required
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </label>
            <div className="span-2">
              <Checkbox
                label="Promoção ativa"
                checked={form.active}
                onChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>
        </div>
        <div className="card-footer">
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn" disabled={busy}>
            {editingId ? 'Salvar alterações' : 'Criar promoção'}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-header">
          <h2>
            Promoções <span className="count">{promos.length}</span>
          </h2>
        </div>
        {promos.length === 0 ? (
          <EmptyState icon="tag" title="Nenhuma promoção">
            Crie uma promoção no formulário acima. É preciso ter produtos cadastrados.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Período</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => {
                  const status = promoStatus(p)
                  return (
                    <tr key={p.id} className={editingId === p.id ? 'is-editing' : ''}>
                      <td>
                        <strong>{p.menuItemName}</strong>{' '}
                        <span className="pct">-{p.discountPercent}%</span>
                      </td>
                      <td className="num">
                        <strong className="new-price">{formatMoney(p.promoPrice)}</strong>
                        <s className="sub">{formatMoney(p.listPrice)}</s>
                      </td>
                      <td className="period">
                        {formatDateTime(p.startsAt, { dateStyle: 'short', timeStyle: 'short' })}
                        <span className="sub">
                          até {formatDateTime(p.endsAt, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status.tone}`}>{status.label}</span>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Editar"
                          aria-label={`Editar promoção de ${p.menuItemName}`}
                          onClick={() => startEdit(p)}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Excluir"
                          aria-label={`Excluir promoção de ${p.menuItemName}`}
                          onClick={() => handleDelete(p)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
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

// Traduz os campos da promoção num rótulo + cor de badge.
function promoStatus(p) {
  if (p.isLive) return { label: 'No ar', tone: 'success' }
  if (!p.active) return { label: 'Inativa', tone: '' }
  if (new Date(p.startsAt) > new Date()) return { label: 'Agendada', tone: 'info' }
  return { label: 'Expirada', tone: 'warn' }
}
