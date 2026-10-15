// Rotas do site do cliente. Existem dois grupos de páginas:
// 1) navegação livre (/cardapio, etc) — só para OLHAR o cardápio, sem carrinho ativo;
// 2) "/mesa/:tableToken" — o fluxo de verdade, depois que o cliente liberou a
//    mesa com a senha do dia: aqui o carrinho fica ligado ao token daquela mesa.
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { CartProvider } from './cart/CartContext'
import { useKioskMode } from './hooks/useKioskMode'
import { ToastProvider } from './components/Toast'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderStatusPage from './pages/OrderStatusPage'
import PaymentPage from './pages/PaymentPage'
import TableGatePage from './pages/TableGatePage'

// Só ativa o modo "kiosk" (tablet fixo na mesa) se a URL pedir via ?kiosk=1.
function KioskBootstrap() {
  useKioskMode()
  return null
}

// Cria um CartProvider "amarrado" ao token da mesa atual (vindo da URL),
// para todo pedido feito aqui já saber de qual sessão de mesa ele é.
function TableSessionLayout() {
  const { tableToken } = useParams()
  return (
    <CartProvider accessToken={tableToken || null}>
      <Outlet />
    </CartProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <KioskBootstrap />
        <Routes>
          {/* Navegação livre: sem mesa vinculada (accessToken null), só para olhar o cardápio. */}
          <Route
            element={
              <CartProvider accessToken={null}>
                <Outlet />
              </CartProvider>
            }
          >
            <Route path="/" element={<Navigate to="/cardapio" replace />} />
            <Route path="/cardapio" element={<MenuPage browseOnly />} />
            <Route path="/m/:tableId" element={<TableGatePage />} />
            <Route path="/carrinho" element={<Navigate to="/cardapio" replace />} />
            <Route path="/pagamento/:orderId" element={<PaymentPage />} />
            <Route path="/pedido/:orderId" element={<OrderStatusPage />} />
          </Route>

          {/* Fluxo real do cliente: mesa liberada, carrinho vinculado ao token da sessão. */}
          <Route path="/mesa/:tableToken" element={<TableSessionLayout />}>
            <Route index element={<MenuPage />} />
            <Route path="carrinho" element={<CartPage />} />
            <Route path="pagamento/:orderId" element={<PaymentPage />} />
            <Route path="pedido/:orderId" element={<OrderStatusPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
