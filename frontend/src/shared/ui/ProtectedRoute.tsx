import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores'

interface ProtectedRouteProps {
  roles?: string[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0) {
    const userRoles = user?.roles ?? []
    const hasRole = roles.some((r) => userRoles.includes(r))
    if (!hasRole) {
      return <Navigate to="/forbidden" replace />
    }
  }

  return <Outlet />
}
