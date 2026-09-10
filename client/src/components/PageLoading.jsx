import React from 'react'

/** Loading padrão do client (spinner + fade-out do fundo). */
export default function PageLoading({ active }) {
  const [mounted, setMounted] = React.useState(active)
  const [leaving, setLeaving] = React.useState(false)

  React.useEffect(() => {
    if (active) {
      setMounted(true)
      setLeaving(false)
      return
    }
    if (!mounted) return
    setLeaving(true)
    const t = setTimeout(() => {
      setMounted(false)
      setLeaving(false)
    }, 380)
    return () => clearTimeout(t)
  }, [active, mounted])

  if (!mounted) return null

  return (
    <div className={`page-loading ${leaving ? 'out' : ''}`} aria-busy="true">
      <div className="spinner" />
      <style>{`
        .page-loading {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          background: var(--bg);
          opacity: 1;
          transition: opacity 0.38s ease;
        }
        .page-loading.out {
          opacity: 0;
          pointer-events: none;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid rgba(245, 239, 230, 0.15);
          border-top-color: var(--accent);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
