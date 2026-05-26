import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { api } from '../lib/api'
import { useAuthStore } from '../stores'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await api.post('/auth/register', {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
      })
      const { access_token, refresh_token, user } = res.data
      login(access_token, refresh_token, user)
      navigate('/')
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 409) {
        setError('El email ya está registrado.')
      } else if (status === 429) {
        setError('Demasiadas solicitudes. Esperá un momento.')
      } else if (detail) {
        setError(detail)
      } else {
        setError('Error al registrarse. Intentá de nuevo.')
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
          <p className="text-muted-foreground mt-2">Crear tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            placeholder="Tu nombre"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            placeholder="Mínimo 8 caracteres"
            required
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={formData.confirmar}
            onChange={handleChange('confirmar')}
            placeholder="Repetí la contraseña"
            required
          />

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary/90 font-medium">
            Iniciar Sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
