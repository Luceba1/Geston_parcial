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
import DireccionesPage from '../pages/DireccionesPage'
import PerfilPage from '../pages/PerfilPage'
import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import { CategoriasPage, IngredientesPage, ProductosPage, PedidosPage } from '../pages/admin'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-500">Próximamente disponible</p>
      </div>
    </div>
  )
}

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

      {/* Rutas protegidas (cualquier usuario autenticado) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/direcciones" element={<DireccionesPage />} />
        </Route>
      </Route>

      {/* Rutas protegidas por rol (STOCK/ADMIN/REPARTIDOR) */}
      <Route element={<ProtectedRoute roles={['STOCK', 'ADMIN', 'admin', 'cocinero', 'repartidor']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<PlaceholderPage title="Panel de Administración" />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/ingredientes" element={<IngredientesPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
