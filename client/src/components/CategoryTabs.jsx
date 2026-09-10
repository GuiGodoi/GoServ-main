export default function CategoryTabs({ categories, activeId, onChange }) {
  if (!categories.length) return null

  return (
    <nav className="category-tabs" aria-label="Categorias">
      {categories.map((cat) => {
        const active = cat.id === activeId
        return (
          <button
            key={cat.id}
            type="button"
            className={active ? 'tab active' : 'tab'}
            onClick={() => onChange(cat.id)}
          >
            {cat.name}
          </button>
        )
      })}

      <style>{`
        .category-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.75rem;
          margin-bottom: 1rem;
          scrollbar-width: thin;
        }
        .tab {
          flex: 0 0 auto;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--muted);
          padding: 0.55rem 1rem;
          border-radius: 999px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .tab.active {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }
        .tab:hover {
          color: var(--text);
        }
      `}</style>
    </nav>
  )
}
