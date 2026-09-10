import React from 'react'
import { api } from '../services/api'
import { useContentLoading } from '../components/ui'

const emptyForm = { name: '', sortOrder: 0 }

export default function CategoriesPage() {
  const [items, setItems] = React.useState([])
  const [form, setForm] = React.useState(emptyForm)
  const [editingId, setEditingId] = React.useState(null)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setError('')
      setItems(await api.getCategories())
    } catch (e) {
      setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function startEdit(category) {
    setEditingId(category.id)
    setForm({ name: category.name, sortOrder: category.sortOrder })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (editingId) {
        await api.updateCategory(editingId, payload)
      } else {
        await api.createCategory(payload)
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
    if (!confirm('Excluir esta categoria?')) return
    setBusy(true)
    try {
      await api.deleteCategory(id)
      if (editingId === id) resetForm()
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
        <h1>Categorias</h1>
        <p>Organize o cardápio (Burgers, Bebidas, etc.).</p>
      </header>

      {error && <p className="error">{error}</p>}

      <form className="panel" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>
        <label>
          Nome
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Ordem
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </label>
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
        <h2>Lista</h2>
        <table>
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Nome</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.sortOrder}</td>
                <td>{cat.name}</td>
                <td className="row-actions">
                  <button type="button" className="ghost" onClick={() => startEdit(cat)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(cat.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PageStyles />
    </section>
  )
}

function PageStyles() {
  return (
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
      form label {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 0.75rem;
        font-size: 0.85rem;
        font-weight: 500;
      }
      input, select, textarea {
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0.55rem 0.65rem;
        background: #fff;
      }
      .actions { display: flex; gap: 0.5rem; }
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
      table { width: 100%; border-collapse: collapse; }
      th, td {
        text-align: left;
        padding: 0.55rem 0.35rem;
        border-bottom: 1px solid var(--line);
        font-size: 0.92rem;
      }
      th { color: var(--muted); font-weight: 500; }
      .row-actions { text-align: right; white-space: nowrap; }
    `}</style>
  )
}
