import React from 'react'
import { api } from '../services/api'
import {
  Checkbox,
  EmptyState,
  Icon,
  ImageUpload,
  PageHeader,
  Select,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'
import { formatMoney } from '../utils'
import './ProductsPage.css'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  available: true,
}

// CRUD dos produtos do cardápio: formulário (cria ou edita) + upload de foto
// (com recorte) + tabela com a lista, incluindo alternar disponibilidade rápido.
export default function ProductsPage() {
  const toast = useToast()
  const [items, setItems] = React.useState([])
  const [categories, setCategories] = React.useState([])
  const [form, setForm] = React.useState(emptyForm)
  const [photoFile, setPhotoFile] = React.useState(null)
  const [photoPreview, setPhotoPreview] = React.useState('')
  const [editingId, setEditingId] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  const formRef = React.useRef(null)
  const dialog = useDialog()
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      const [menu, cats] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
      ])
      setItems(menu)
      setCategories(cats)
    } catch (e) {
      toast.error(e)
    } finally {
      setBooting(false)
    }
  }, [toast])

  React.useEffect(() => {
    load()
  }, [load])

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      // Usa "originalPrice" (preço de tabela) quando existir; "price" sozinho
      // pode já vir com desconto aplicado se houver uma promoção ativa.
      price: String(item.originalPrice ?? item.price),
      categoryId: item.categoryId == null ? '' : String(item.categoryId),
      available: item.available,
    })
    setPhotoFile(null)
    setPhotoPreview(item.photoUrl || '')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    try {
      const payload = buildPayload()
      let id = editingId
      if (editingId) {
        await api.updateMenuItem(editingId, payload)
      } else {
        const created = await api.createMenuItem(payload)
        id = created.id
      }
      // O produto precisa existir (ter um id) antes de poder receber a foto,
      // por isso o upload só acontece depois de criar/salvar os dados de texto.
      if (photoFile && id) {
        await api.uploadMenuItemPhoto(id, photoFile)
      }
      resetForm()
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(item) {
    const id = item.id
    const ok = await dialog.confirm({
      title: `Excluir "${item.name}"?`,
      message: 'O produto sai do cardápio. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteMenuItem(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      toast.error(err)
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
    const ok = await dialog.confirm({
      title: 'Remover a foto?',
      message: 'O produto passa a aparecer sem imagem no cardápio.',
      confirmLabel: 'Remover',
      tone: 'danger',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteMenuItemPhoto(editingId)
      setPhotoFile(null)
      setPhotoPreview('')
      await load()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  // Botão de atalho na tabela: reenvia os mesmos dados do produto, só
  // invertendo o campo "available" (evita abrir o formulário completo pra isso).
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
      toast.error(err)
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
      <PageHeader
        title="Produtos"
        description="Itens do cardápio com foto, preço e categoria. As fotos são recortadas em 1:1 e salvas em JPEG."
      />

      <form className="card" onSubmit={handleSubmit} ref={formRef}>
        <div className="card-header">
          <h2>
            <Icon name={editingId ? 'edit' : 'plus'} />
            {editingId ? 'Editar produto' : 'Novo produto'}
          </h2>
          {editingId && <span className="badge info">Editando #{editingId}</span>}
        </div>
        <div className="card-body product-form">
          <ImageUpload
            previewUrl={photoPreview}
            onFileChange={(file) => {
              setPhotoFile(file)
              setPhotoPreview(file ? URL.createObjectURL(file) : '')
            }}
            onClear={clearPhoto}
            disabled={busy}
          />
          <div className="form-grid">
            <label className="field span-2">
              <span>Nome</span>
              <input
                className="input"
                required
                placeholder="Ex.: X-Burger da casa"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Preço</span>
              <div className="input-group">
                <span className="prefix">R$</span>
                <input
                  className="input"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </label>
            <Select
              label="Categoria"
              value={form.categoryId}
              placeholder="Sem categoria"
              options={categoryOptions}
              onChange={(v) => setForm({ ...form, categoryId: v })}
            />
            <label className="field span-2">
              <span>Descrição</span>
              <textarea
                className="input"
                rows={2}
                placeholder="Ingredientes, tamanho, acompanhamentos…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="span-2">
              <Checkbox
                label="Disponível no cardápio"
                checked={form.available}
                onChange={(v) => setForm({ ...form, available: v })}
              />
            </div>
          </div>
        </div>
        <div className="card-footer">
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn" disabled={busy}>
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {editingId ? 'Salvar alterações' : 'Cadastrar produto'}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-header">
          <h2>
            Cardápio <span className="count">{items.length}</span>
          </h2>
        </div>
        {items.length === 0 ? (
          <EmptyState icon="package" title="Nenhum produto ainda">
            Cadastre o primeiro item do cardápio no formulário acima.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={editingId === item.id ? 'is-editing' : ''}>
                    <td>
                      <div className="with-thumb">
                        {item.photoUrl ? (
                          <img className="thumb" src={item.photoUrl} alt="" />
                        ) : (
                          <span className="thumb">
                            <Icon name="image" size={16} />
                          </span>
                        )}
                        <div>
                          <strong>{item.name}</strong>{' '}
                          {item.isOnPromo && <span className="pct">-{item.discountPercent}%</span>}
                          {item.description && <span className="sub clamp">{item.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{item.categoryName || '—'}</td>
                    <td className="num">{formatMoney(item.originalPrice ?? item.price)}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${item.available ? 'success' : 'warn'}`}
                        onClick={() => toggleAvailable(item)}
                        disabled={busy}
                        title="Clique para alternar"
                      >
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </button>
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Editar ${item.name}`}
                        title="Editar"
                        onClick={() => startEdit(item)}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Excluir ${item.name}`}
                        title="Excluir"
                        onClick={() => handleDelete(item)}
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
    </section>
  )
}
