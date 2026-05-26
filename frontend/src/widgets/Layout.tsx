import { useState, useCallback } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
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
  { label: 'Carrito', path: '/cart', icon: '🛒', roles: ['cliente', 'admin'] },
  { label: 'Mis Pedidos', path: '/orders', icon: '📋', roles: ['cliente', 'admin'] },
  { label: 'Mi Perfil', path: '/perfil', icon: '👤', roles: ['cliente', 'admin', 'cocinero', 'repartidor'] },
  { label: 'Mis Direcciones', path: '/direcciones', icon: '📍', roles: ['cliente', 'admin'] },
  { label: 'Cocina', path: '/cocina', icon: '👨‍🍳', roles: ['cocinero', 'admin', 'pedidos'] },
  { label: 'Productos', path: '/productos', icon: '📦', roles: ['admin'] },
  { label: 'Categorías', path: '/categorias', icon: '📁', roles: ['admin'] },
  { label: 'Ingredientes', path: '/ingredientes', icon: '🧂', roles: ['admin'] },
  { label: 'Alérgenos', path: '/admin/alergenos', icon: '⚠️', roles: ['admin'] },
  { label: 'Panel Pedidos', path: '/pedidos', icon: '📋', roles: ['repartidor', 'admin'] },
  { label: 'Usuarios', path: '/admin/usuarios', icon: '👥', roles: ['admin'] },
  { label: 'Dashboard', path: '/admin', icon: '📊', roles: ['admin'] },
  { label: 'Configuración', path: '/admin/config', icon: '⚙️', roles: ['admin'] },
]

/** Paths que NO debe ver un admin (son de cliente) */
const adminRestrictedPaths = ['/cart', '/orders', '/direcciones', '/perfil']

function getFilteredNavItems(userRoles: string[] | undefined): NavItem[] {
  if (!userRoles || userRoles.length === 0) {
    return allNavItems.filter((item) => !item.roles)
  }

  const isAdmin = userRoles.includes('admin')

  return allNavItems.filter((item) => {
    // Si es admin, ocultar paths de cliente
    if (isAdmin && adminRestrictedPaths.includes(item.path)) return false
    // Items públicos visibles para todos
    if (!item.roles) return true
    // Acceso por roles
    return item.roles.some((r) => userRoles.includes(r))
  })
}

function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-accent transition-colors"
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('transition-transform duration-200', className)}
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isCocinero = user?.roles?.includes('cocinero') && !user?.roles?.includes('admin')
  const homePath = isCocinero ? '/cocina' : '/'
  const navItems = getFilteredNavItems(user?.roles)

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className={cn(
          'bg-card shadow-sm border-b border-border fixed top-0 right-0 z-40 transition-all duration-200',
          sidebarCollapsed ? 'left-16 lg:left-16' : 'left-0 lg:left-64'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to={homePath} className="text-xl font-bold text-primary whitespace-nowrap">
              FoodStore
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartBadge />
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.nombre}
                  <span className="text-muted-foreground/60 ml-1">
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

      <div className="flex flex-1 pt-14">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-30 bg-card border-r border-border',
            'transform transition-all duration-200 ease-in-out',
            'flex flex-col',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'hidden lg:flex items-center justify-center h-12 border-b border-border',
              'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              sidebarCollapsed ? 'w-16' : 'w-64'
            )}
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <ChevronLeftIcon className={sidebarCollapsed ? 'rotate-180' : ''} />
          </button>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // Si es cocinero, "Inicio" va a /cocina
              const itemPath = item.label === 'Inicio' && isCocinero ? '/cocina' : item.path
              const isActive = itemPath === '/'
                ? location.pathname === '/'
                : location.pathname === itemPath || location.pathname.startsWith(itemPath + '/')
              return (
                <Link
                  key={item.path}
                  to={itemPath}
                  onClick={() => {
                    setSidebarOpen(false)
                  }}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={cn('text-lg', sidebarCollapsed ? '' : '')}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}

            {/* Tooltip-style label on hover when collapsed could be added with CSS */}
          </nav>
        </aside>

        {/* Main content */}
        <main
          className={cn(
            'flex-1 overflow-auto transition-all duration-200',
            sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
