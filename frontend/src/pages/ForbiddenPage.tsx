import { Link } from 'react-router-dom'
import { Button } from '../shared/ui/Button'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 mb-6">
          No tenés permisos para acceder a esta página.
        </p>
        <Link to="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </div>
    </div>
  )
}
