import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { useAuthStore } from '../stores'

const iconPackage = (
  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
)

const iconUsers = (
  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
)

const iconChart = (
  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
)

function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary tracking-tight">
          FoodStore
        </Link>
        <nav className="flex gap-4 items-center">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.nombre} <span className="text-muted-foreground/60">({user.roles?.join(', ')})</span>
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
        </nav>
      </div>
    </header>
  )
  function handleLogout() {
    logout()
    navigate('/login')
  }
}

function HeroSection() {
  const { isAuthenticated, user } = useAuthStore()
  const isAdmin = isAuthenticated && user?.roles?.includes('admin')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-bg/80 via-amber-bg/40 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-text/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 py-24 text-center relative">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          {isAdmin ? 'Panel de Administración' : 'Bienvenido a '}
          {!isAdmin && <span className="text-primary">FoodStore</span>}
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          {isAdmin
            ? 'Gestioná los productos, usuarios y configuración del sistema desde un solo lugar.'
            : 'Descubrí una experiencia única de comida. Productos frescos, preparación artesanal y el mejor sabor, directo a tu puerta.'
          }
        </p>

        {!isAdmin && (
          <Link to="/catalogo">
            <Button size="lg" className="px-10 py-4 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-shadow">
              Ver todos nuestros productos
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}

function QuienesSomos() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Quiénes Somos</h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed text-lg">
              En <strong className="text-foreground">FoodStore</strong> nos apasiona la buena comida. Desde nuestros
              inicios, nos dedicamos a seleccionar los mejores ingredientes y preparar cada plato con el mismo
              cuidado que si fuera para nuestra propia familia.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Creemos que la comida no es solo alimentación, es una experiencia que conecta personas. Por eso
              trabajamos todos los días para ofrecerte sabores auténticos, calidad consistente y un servicio
              que te haga sentir como en casa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-primary">5+</p>
              <p className="text-sm text-muted-foreground mt-1">Años de experiencia</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-primary">200+</p>
              <p className="text-sm text-muted-foreground mt-1">Platos preparados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-sm text-muted-foreground mt-1">Ingredientes frescos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Satisfacción garantizada</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ofrecemos = [
  {
    title: 'Productos Frescos',
    description: 'Seleccionamos los mejores ingredientes frescos para garantizar el máximo sabor en cada bocado.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    title: 'Preparación Artesanal',
    description: 'Cada plato es preparado al momento con recetas tradicionales y un toque moderno.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    title: 'Envío a Domicilio',
    description: 'Llevamos el sabor directo a tu puerta con entregas rápidas y seguras.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: 'Variedad para Todos',
    description: 'Desde opciones clásicas hasta propuestas innovadoras, siempre hay algo nuevo para probar.',
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

function QueOfrecemos() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Qué Ofrecemos</h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Todo lo que necesitás para disfrutar de una experiencia gastronómica única sin salir de casa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ofrecemos.map((item) => (
            <Card key={item.title} className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}


function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FoodStore. Todos los derechos reservados.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/catalogo" className="hover:text-foreground transition-colors">
            Catálogo
          </Link>
          <Link to="/cart" className="hover:text-foreground transition-colors">
            Carrito
          </Link>
          <Link to="/orders" className="hover:text-foreground transition-colors">
            Pedidos
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = isAuthenticated && user?.roles?.includes('admin')
  const isCocinero = isAuthenticated && user?.roles?.includes('cocinero')

  // Si es solo cocinero (no admin), redirigir directo a la cocina
  if (isCocinero && !isAdmin) {
    navigate('/cocina', { replace: true })
    return null
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-widest font-medium">
            Acceso Rápido
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link to="/productos" className="block">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {iconPackage}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Administrar Productos</h3>
                <p className="text-sm text-muted-foreground">
                  Creá, editá y gestioná el catálogo de productos del menú.
                </p>
              </Card>
            </Link>

            <Link to="/admin/usuarios" className="block">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {iconUsers}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ver Usuarios</h3>
                <p className="text-sm text-muted-foreground">
                  Administrá los usuarios, roles y permisos del sistema.
                </p>
              </Card>
            </Link>

            <Link to="/admin" className="block">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {iconChart}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Visualizá estadísticas, ventas y métricas del negocio.
                </p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <QuienesSomos />
      <QueOfrecemos />
      <Footer />
    </div>
  )
}
