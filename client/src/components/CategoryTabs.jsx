// Abas horizontais para filtrar o cardápio por categoria (fixas no topo ao rolar).
import './CategoryTabs.css'

export default function CategoryTabs({ categories, activeId, onChange }) {
  if (!categories.length) return null

  return (
    <nav className="category-tabs" aria-label="Categorias">
      <div className="category-scroll">
        {categories.map((cat) => {
          const active = cat.id === activeId
          return (
            <button
              key={cat.id}
              type="button"
              className={active ? 'tab active' : 'tab'}
              aria-pressed={active}
              onClick={() => onChange(cat.id)}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
