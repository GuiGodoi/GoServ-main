// Contexto do carrinho: guarda os itens escolhidos pelo cliente enquanto ele
// navega pelo cardápio, disponível para qualquer componente via useCart().
import React from 'react'

const CartContext = React.createContext(null)

// Id local (só no navegador) para cada linha do carrinho, usado como "key"
// do React e para editar/remover uma linha específica.
let lineIdSeq = 1

export function CartProvider({ children, accessToken = null }) {
  const [lines, setLines] = React.useState([])
  const [customerNotes, setCustomerNotes] = React.useState('')

  function addLine({ menuItem, quantity, notes, addons }) {
    setLines((prev) => [
      ...prev,
      {
        key: lineIdSeq++,
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: Number(menuItem.price),
        photoUrl: menuItem.photoUrl,
        quantity,
        notes: notes || '',
        addons: addons || [],
      },
    ])
  }

  function updateQuantity(key, quantity) {
    if (quantity <= 0) {
      removeLine(key)
      return
    }
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, quantity } : line))
    )
  }

  function removeLine(key) {
    setLines((prev) => prev.filter((line) => line.key !== key))
  }

  function clear() {
    setLines([])
    setCustomerNotes('')
  }

  // Total só para exibir na tela (uma estimativa). O valor que realmente vale
  // é sempre recalculado pelo backend ao criar o pedido — o front nunca decide o preço final.
  function lineEstimate(line) {
    const addons = (line.addons || []).reduce((sum, a) => sum + Number(a.price), 0)
    return (line.unitPrice + addons) * line.quantity
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const estimateTotal = lines.reduce((sum, line) => sum + lineEstimate(line), 0)

  // Monta o corpo da requisição POST /api/orders. "clientUnitPrice" vai só
  // como referência — o backend ignora esse valor e recalcula tudo sozinho.
  function toCreatePayload() {
    return {
      accessToken: accessToken || null,
      customerNotes: customerNotes || null,
      items: lines.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        notes: line.notes || null,
        addons: (line.addons || []).map((a) => ({ addonId: a.id })),
        clientUnitPrice: line.unitPrice,
      })),
    }
  }

  const value = {
    lines,
    accessToken,
    customerNotes,
    setCustomerNotes,
    addLine,
    updateQuantity,
    removeLine,
    clear,
    itemCount,
    estimateTotal,
    lineEstimate,
    toCreatePayload,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
