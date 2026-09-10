import React from 'react'

/**
 * Loading da área principal: spinner ao centro do `<main>`, sem cobrir a sidebar.
 * Use `active={true}` enquanto a rota/página carrega.
 */
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
    <div className={`page-loading ${leaving ? 'out' : ''}`} aria-busy="true" aria-live="polite">
      <div className="spinner" />
      <style>{`
        .page-loading {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: grid;
          place-items: center;
          background: var(--bg, #f3f0ea);
          opacity: 1;
          transition: opacity 0.38s ease;
        }
        .page-loading.out {
          opacity: 0;
          pointer-events: none;
        }
        .page-loading .spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid rgba(28, 25, 21, 0.12);
          border-top-color: var(--accent, #1f6b4a);
          animation: page-spin 0.7s linear infinite;
        }
        @keyframes page-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
