import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores'
import { Button } from '../shared/ui/Button'
import { CartBadge } from './CartBadge'

interface NavItem {
  label: string
  path: string
  icon: string
  roles?: string[]
}

const allNavItems: NavItem[] = [
  { label: 'Inicio', path: '/', icon: '🏠' },
  { label: 'Catálogo', path: '/catalogo', icon: '📦' },
  { label: 'Carrito', path: '/cart', icon: '🛒' },
  { label: 'Mis Pedidos', path: '/orders', icon: '📋', roles: ['cliente', 'admin'] },
  { label: 'Mi Perfil', path: '/perfil', icon: '👤', roles: ['cliente', 'admin', 'cocinero', 'repartidor'] },
  { label: 'Mis Direcciones', path: '/direcciones', icon: '📍', roles: ['cliente', 'admin'] },
  { label: 'Productos', path: '/productos', icon: '📦', roles: ['cocinero', 'admin'] },
  { label: 'Categorías', path: '/categorias', icon: '📁', roles: ['cocinero', 'admin'] },
  { label: 'Ingredientes', path: '/ingredientes', icon: '🧂', roles: ['admin'] },
  { label: 'Panel Pedidos', path: '/pedidos', icon: '📋', roles: ['repartidor', 'admin'] },
  { label: 'Usuarios', path: '/admin/usuarios', icon: '👥', roles: ['admin'] },
  { label: 'Dashboard', path: '/admin', icon: '📊', roles: ['admin'] },
  { label: 'Configuración', path: '/admin/config', icon: '⚙️', roles: ['admin'] },
]

function getFilteredNavItems(userRoles: string[] | undefined): NavItem[] {
  if (!userRoles || userRoles.length === 0) {
    return allNavItems.filter((item) => !item.roles)
  }
  return allNavItems.filter((item) => {
    if (!item.roles) return true // public
    return item.roles.some((r) => userRoles.includes(r))
  })
}

export function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = getFilteredNavItems(user?.roles)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to="/" className="text-xl font-bold text-green-600">
              FoodStore
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <CartBadge />
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.nombre}
                  <span className="text-gray-400 ml-1">
                    ({user.roles?.join(', ')})
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Ingresar
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:block pt-16 lg:pt-4
          `}
        >
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
