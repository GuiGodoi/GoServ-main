import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { CartProvider } from './cart/CartContext'
import { useKioskMode } from './hooks/useKioskMode'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderStatusPage from './pages/OrderStatusPage'
import PaymentPage from './pages/PaymentPage'
import TableGatePage from './pages/TableGatePage'

function KioskBootstrap() {
  useKioskMode()
  return null
}

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
    <BrowserRouter>
      <KioskBootstrap />
      <Routes>
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

        <Route path="/mesa/:tableToken" element={<TableSessionLayout />}>
          <Route index element={<MenuPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="pagamento/:orderId" element={<PaymentPage />} />
          <Route path="pedido/:orderId" element={<OrderStatusPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
