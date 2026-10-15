import React from 'react'
import { api } from '../services/api'
import {
  EmptyState,
  Icon,
  PageHeader,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'

const emptyForm = { name: '', sortOrder: 0 }

// CRUD simples de categorias: um formulário (cria ou edita, dependendo de
// "editingId") + uma tabela com a lista atual.
export default function CategoriesPage() {
  const toast = useToast()
  const [items, setItems] = React.useState([])
  const [form, setForm] = React.useState(emptyForm)
  const [editingId, setEditingId] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  const dialog = useDialog()
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      setItems(await api.getCategories())
    } catch (e) {
      toast.error(e)
    } finally {
      setBooting(false)
    }
  }, [toast])

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
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(category) {
    const id = category.id
    const ok = await dialog.confirm({
      title: `Excluir "${category.name}"?`,
      message: 'Os produtos desta categoria ficam sem categoria.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return

    setBusy(true)
    try {
      await api.deleteCategory(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Categorias"
        description="Organize o cardápio em seções (Burgers, Bebidas, Sobremesas…). A ordem define a sequência das abas para o cliente."
      />

      <div className="split">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>
              <Icon name={editingId ? 'edit' : 'plus'} />
              {editingId ? 'Editar categoria' : 'Nova categoria'}
            </h2>
          </div>
          <div className="card-body stack">
            <label className="field">
              <span>Nome</span>
              <input
                className="input"
                required
                placeholder="Ex.: Bebidas"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Ordem de exibição</span>
              <input
                className="input"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
              <span className="hint">Números menores aparecem primeiro.</span>
            </label>
          </div>
          <div className="card-footer">
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn" disabled={busy}>
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <div className="card">
          <div className="card-header">
            <h2>
              Categorias <span className="count">{items.length}</span>
            </h2>
          </div>
          {items.length === 0 ? (
            <EmptyState icon="layers" title="Nenhuma categoria">
              Crie a primeira para começar a montar o cardápio.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Ordem</th>
                    <th>Nome</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((cat) => (
                    <tr key={cat.id} className={editingId === cat.id ? 'is-editing' : ''}>
                      <td>
                        <span className="order-chip">{cat.sortOrder}</span>
                      </td>
                      <td><strong>{cat.name}</strong></td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Editar"
                          aria-label={`Editar ${cat.name}`}
                          onClick={() => startEdit(cat)}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Excluir"
                          aria-label={`Excluir ${cat.name}`}
                          onClick={() => handleDelete(cat)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
