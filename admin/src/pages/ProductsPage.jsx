import React from 'react'
import { api } from '../services/api'
import { Checkbox, Select, ImageUpload, useContentLoading } from '../components/ui'
import { formatMoney } from '../utils'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  available: true,
}

export default function ProductsPage() {
  const [items, setItems] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [form, setForm] = React.useState(emptyForm)
  const [photoFile, setPhotoFile] = React.useState(null)
  const [photoPreview, setPhotoPreview] = React.useState('')
  const [editingId, setEditingId] = React.useState(null)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setError('')
      const [menu, cats] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
      ])
      setItems(menu)
      setCategories(cats)
    } catch (e) {
      setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.originalPrice ?? item.price),
      categoryId: item.categoryId == null ? '' : String(item.categoryId),
      available: item.available,
    })
    setPhotoFile(null)
    setPhotoPreview(item.photoUrl || '')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setPhotoPreview('')
  }

  function buildPayload() {
    return {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      available: form.available,
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = buildPayload()
      let id = editingId
      if (editingId) {
        await api.updateMenuItem(editingId, payload)
      } else {
        const created = await api.createMenuItem(payload)
        id = created.id
      }
      if (photoFile && id) {
        await api.uploadMenuItemPhoto(id, photoFile)
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este produto?')) return
    setBusy(true)
    try {
      await api.deleteMenuItem(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function clearPhoto() {
    if (!editingId) {
      setPhotoFile(null)
      setPhotoPreview('')
      return
    }
    if (!confirm('Remover a foto deste produto?')) return
    setBusy(true)
    try {
      await api.deleteMenuItemPhoto(editingId)
      setPhotoFile(null)
      setPhotoPreview('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleAvailable(item) {
    setBusy(true)
    try {
      await api.updateMenuItem(item.id, {
        name: item.name,
        description: item.description,
        price: item.originalPrice ?? item.price,
        categoryId: item.categoryId,
        available: !item.available,
      })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  return (
    <section className="page">
      <header>
        <h1>Produtos</h1>
        <p>Cadastre itens do cardápio. Fotos vão para o banco em JPEG.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <form className="panel" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar produto' : 'Novo produto'}</h2>
        <div className="grid">
          <label className="field">
            Nome
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            Preço (R$)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <Select
            label="Categoria"
            value={form.categoryId}
            placeholder="Sem categoria"
            options={categoryOptions}
            onChange={(v) => setForm({ ...form, categoryId: v })}
          />
          <div className="check-wrap">
            <Checkbox
              label="Disponível no cardápio"
              checked={form.available}
              onChange={(v) => setForm({ ...form, available: v })}
            />
          </div>
        </div>
        <label className="field">
          Descrição
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <ImageUpload
          previewUrl={photoPreview}
          onFileChange={(file) => {
            setPhotoFile(file)
            setPhotoPreview(file ? URL.createObjectURL(file) : '')
          }}
          onClear={clearPhoto}
          disabled={busy}
        />

        <div className="actions">
          <button type="submit" disabled={busy}>
            {editingId ? 'Salvar' : 'Cadastrar'}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="panel">
        <h2>Lista ({items.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="product-cell">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" />
                    ) : (
                      <span className="ph" />
                    )}
                    <span>
                      {item.name}
                      {item.isOnPromo && (
                        <span className="promo-tag">-{item.discountPercent}%</span>
                      )}
                    </span>
                  </div>
                </td>
                <td>{item.categoryName || '—'}</td>
                <td>{formatMoney(item.originalPrice ?? item.price)}</td>
                <td>
                  <button
                    type="button"
                    className={item.available ? 'status on' : 'status off'}
                    onClick={() => toggleAvailable(item)}
                    disabled={busy}
                  >
                    {item.available ? 'Disponível' : 'Indisponível'}
                  </button>
                </td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => startEdit(item)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Excluir
                  </button>
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
          margin-bottom: 0.75rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .check-wrap {
          display: flex;
          align-items: end;
          padding-bottom: 0.35rem;
        }
        input, textarea {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0.55rem 0.65rem;
          background: #fff;
          font: inherit;
        }
        .actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .page button {
          border: none;
          background: var(--accent);
          color: #fff;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .page button:hover { background: var(--accent-hover); }
        .page button:disabled { opacity: 0.6; cursor: wait; }
        .page button.ghost {
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .page button.danger {
          background: transparent;
          color: var(--danger);
          border: 1px solid transparent;
        }
        .page button.status {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        .page button.status.on {
          background: rgba(31, 107, 74, 0.12);
          color: var(--accent);
        }
        .page button.status.off {
          background: rgba(154, 107, 18, 0.12);
          color: var(--warn);
        }
        table { width: 100%; border-collapse: collapse; }
        th, td {
          text-align: left;
          padding: 0.55rem 0.35rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.9rem;
          vertical-align: middle;
        }
        th { color: var(--muted); font-weight: 500; }
        .row-actions { text-align: right; white-space: nowrap; }
        .product-cell {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .product-cell img, .ph {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--bg);
        }
        .promo-tag {
          display: inline-block;
          margin-left: 0.35rem;
          font-size: 0.65rem;
          font-weight: 700;
          color: #1f6b4a;
          background: rgba(31, 107, 74, 0.12);
          padding: 0.1rem 0.35rem;
          border-radius: 999px;
        }
        @media (max-width: 640px) {
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
