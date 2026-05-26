import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { api } from '../lib/api'
import { useAuthStore } from '../stores'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = res.data
      login(access_token, refresh_token, user)

      // Si es cocinero, va directo a la cocina
      if (user?.roles?.includes('cocinero')) {
        navigate('/cocina')
        return
      }

      navigate(searchParams.get('redirect') || '/')
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 429) {
        setError('Demasiados intentos. Esperá un momento e intentá de nuevo.')
      } else if (detail) {
        setError(detail)
      } else {
        setError('Error al iniciar sesión. Verificá tus credenciales.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {/* Volver al inicio */}
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver al Inicio
      </Link>

      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">FoodStore</h1>
          <p className="text-muted-foreground mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-primary hover:text-primary/90 font-medium">
            Registrarse
          </Link>
        </p>
      </Card>
    </div>
  )
}
