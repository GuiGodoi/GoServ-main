import React from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchCategories,
  fetchMenuItems,
  validateTableSession,
} from '../services/api'
import { useCart } from '../cart/CartContext'
import { useKioskMode } from '../hooks/useKioskMode'
import { useKioskIdleReset } from '../hooks/useKioskIdleReset'
import MenuItemCard from '../components/MenuItemCard'
import CategoryTabs from '../components/CategoryTabs'
import CustomizeModal from '../components/CustomizeModal'
import CartBar from '../components/CartBar'
import ClientTopBar from '../components/ClientTopBar'
import PageLoading from '../components/PageLoading'

const PROMO_TAB = 'promos'

export default function MenuPage({ browseOnly = false }) {
  const { tableToken } = useParams()
  const kiosk = useKioskMode()
  const cart = useCart()
  const homePath = tableToken ? `/mesa/${tableToken}` : '/cardapio'
  useKioskIdleReset(browseOnly ? null : homePath)
  const [session, setSession] = React.useState(null)
  const [categories, setCategories] = React.useState([])
  const [items, setItems] = React.useState([])
  const [activeCategoryId, setActiveCategoryId] = React.useState(PROMO_TAB)
  const [selectedItem, setSelectedItem] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const canOrder = !browseOnly && Boolean(tableToken)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        if (tableToken) {
          const tableSession = await validateTableSession(tableToken)
          if (cancelled) return
          setSession(tableSession)
        }

        const [cats, menu] = await Promise.all([
          fetchCategories(),
          fetchMenuItems(false),
        ])
        if (cancelled) return
        setCategories(cats)
        setItems(menu)
        const hasPromo = menu.some((i) => i.isOnPromo && i.available !== false)
        setActiveCategoryId(hasPromo ? PROMO_TAB : cats[0]?.id ?? PROMO_TAB)
      } catch (e) {
        if (!cancelled) {
          setError(
            tableToken
              ? e.message || 'Sessão da mesa inválida ou expirada.'
              : e.message || 'Falha ao carregar o cardápio'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [tableToken])

  const tabs = React.useMemo(() => {
    const list = [{ id: PROMO_TAB, name: 'Promoções' }]
    return [...list, ...categories]
  }, [categories])

  const visibleItems =
    activeCategoryId === PROMO_TAB
      ? items.filter((item) => item.isOnPromo)
      : items.filter((item) => item.categoryId === activeCategoryId)

  function handleAdd(item) {
    if (!canOrder || !item.available) return
    setSelectedItem(item)
  }

  return (
    <div className={`menu-page ${browseOnly ? 'browse' : ''}`}>
      <PageLoading active={loading} />
      <ClientTopBar tableLabel={session?.tableLabel} />
      {browseOnly && (
        <p className="browse-banner">
          Cardápio para consulta. Para pedir, escaneie o QR da sua mesa.
        </p>
      )}
      {session?.guestName && (
        <p className="guest-line">Olá, {session.guestName}</p>
      )}
      {kiosk && <p className="kiosk-line">Modo kiosk</p>}

      {error && <p className="state error">{error}</p>}

      {!error && (
        <>
          <CategoryTabs
            categories={tabs}
            activeId={activeCategoryId}
            onChange={setActiveCategoryId}
          />

          <section className="menu-grid" aria-live="polite">
            {!loading && visibleItems.length === 0 ? (
              <p className="state">
                {activeCategoryId === PROMO_TAB
                  ? 'Nenhuma promoção no momento.'
                  : 'Nenhum item nesta categoria.'}
              </p>
            ) : (
              visibleItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={canOrder ? handleAdd : undefined}
                  browseOnly={browseOnly}
                />
              ))
            )}
          </section>
        </>
      )}

      {selectedItem && canOrder && cart && (
        <CustomizeModal
          item={selectedItem}
          tableLabel={session?.tableLabel}
          onClose={() => setSelectedItem(null)}
          onConfirm={(payload) => {
            cart.addLine(payload)
            setSelectedItem(null)
          }}
        />
      )}

      {canOrder && <CartBar tableToken={tableToken} />}

      <style>{`
        .menu-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 0.75rem max(1rem, env(safe-area-inset-right)) 5.5rem max(1rem, env(safe-area-inset-left));
        }
        .menu-page.browse { padding-bottom: 2rem; }
        .browse-banner {
          margin: 0 0 0.85rem;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .guest-line {
          margin: -0.25rem 0 0.65rem;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .kiosk-line {
          margin: -0.35rem 0 0.75rem;
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .menu-grid { display: grid; gap: 0.15rem; }
        .state { color: var(--muted); }
        .state.error { color: var(--danger); }
      `}</style>
    </div>
  )
}
