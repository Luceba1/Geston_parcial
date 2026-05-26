import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../shared/ui/ProtectedRoute'
import { Layout } from '../widgets/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForbiddenPage from '../pages/ForbiddenPage'
import CatalogoPage from '../pages/CatalogoPage'
import ProductoDetallePage from '../pages/ProductoDetallePage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import DireccionesPage from '../pages/DireccionesPage'
import PerfilPage from '../pages/PerfilPage'
import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import PagoExitosoPage from '../pages/PagoExitosoPage'
import PagoFallidoPage from '../pages/PagoFallidoPage'
import PagoPendientePage from '../pages/PagoPendientePage'
import { CategoriasPage, IngredientesPage, ProductosPage, PedidosPage, DashboardPage, UsuariosPage, ConfigPage, AlergenosPage } from '../pages/admin'
import CocinaPage from '../pages/CocinaPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/catalogo" element={<Layout />}>
        <Route index element={<CatalogoPage />} />
      </Route>
      <Route path="/productos/:id" element={<Layout />}>
        <Route index element={<ProductoDetallePage />} />
      </Route>
      <Route path="/cart" element={<Layout />}>
        <Route index element={<CartPage />} />
      </Route>

      {/* Rutas protegidas (cualquier usuario autenticado) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/success" element={<PagoExitosoPage />} />
          <Route path="/orders/:id/failure" element={<PagoFallidoPage />} />
          <Route path="/orders/:id/pending" element={<PagoPendientePage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/direcciones" element={<DireccionesPage />} />
        </Route>
      </Route>

      {/* Rutas protegidas por rol (STOCK/ADMIN/REPARTIDOR) */}
      <Route element={<ProtectedRoute roles={['admin', 'repartidor', 'stock', 'cocinero', 'pedidos']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/usuarios" element={<UsuariosPage />} />
          <Route path="/admin/config" element={<ConfigPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/ingredientes" element={<IngredientesPage />} />
          <Route path="/admin/alergenos" element={<AlergenosPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
        </Route>
      </Route>

      {/* KDS: Pantalla de cocina */}
      <Route element={<ProtectedRoute roles={['cocinero', 'admin', 'pedidos']} />}>
        <Route element={<Layout />}>
          <Route path="/cocina" element={<CocinaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
