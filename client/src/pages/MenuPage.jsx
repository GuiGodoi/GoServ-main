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
import Icon from '../components/Icon'
import './MenuPage.css'


// Id "falso" de categoria usado só para a aba de promoções, que não existe no banco.
const PROMO_TAB = 'promos'

// Tela principal: mostra o cardápio (com abas de categoria) e, quando a mesa
// está liberada, permite adicionar itens ao carrinho pelo CustomizeModal.
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

  // Só permite montar pedido se a página não for "só consulta" e existir uma mesa vinculada.
  const canOrder = !browseOnly && Boolean(tableToken)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        // Se veio de uma mesa (URL "/mesa/:tableToken"), confirma que a sessão
        // ainda é válida antes de mostrar o cardápio "liberado para pedir".
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
        // Abre direto na aba "Promoções" se houver alguma promo disponível
        // agora; senão cai na primeira categoria de verdade.
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

  const activeTab = tabs.find((t) => t.id === activeCategoryId)

  return (
    <div className={`page menu-page ${browseOnly ? 'browse' : ''}`}>
      <PageLoading active={loading} />
      <ClientTopBar tableLabel={session?.tableLabel} />

      {error ? (
        <div className="screen-state">
          <span className="state-icon">
            <Icon name="alert" size={28} />
          </span>
          <h2>Ops, algo deu errado</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <section className="menu-hero">
            {session?.guestName ? (
              <>
                <span className="eyebrow">Olá, {session.guestName}</span>
                <h1 className="display">O que vai pedir hoje?</h1>
              </>
            ) : (
              <>
                <span className="eyebrow">Cardápio</span>
                <h1 className="display">Bem-vindo! Dê uma olhada.</h1>
              </>
            )}
            {kiosk && <span className="pill pill-muted kiosk-pill">Modo kiosk</span>}
          </section>

          {browseOnly && (
            <div className="notice notice-info browse-banner">
              <Icon name="eye" size={16} />
              <span>Cardápio só para consulta. Para pedir, escaneie o QR code da sua mesa.</span>
            </div>
          )}

          <CategoryTabs
            categories={tabs}
            activeId={activeCategoryId}
            onChange={setActiveCategoryId}
          />

          {activeTab && !loading && (
            <h2 className="menu-section-title">
              {activeTab.name}
              <span>{visibleItems.length}</span>
            </h2>
          )}

          <section className="menu-grid" aria-live="polite">
            {!loading && visibleItems.length === 0 ? (
              <div className="screen-state compact">
                <span className="state-icon">
                  <Icon name="utensils" size={24} />
                </span>
                <p>
                  {activeCategoryId === PROMO_TAB
                    ? 'Nenhuma promoção no momento.'
                    : 'Nenhum item nesta categoria.'}
                </p>
              </div>
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
    </div>
  )
}
