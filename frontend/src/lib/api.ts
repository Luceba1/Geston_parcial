import axios from 'axios'
import { useAuthStore } from '../stores'
import { useUIStore } from '../stores/uiStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Cola de requests pendientes mientras se refresca el token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })
  failedQueue = []
}

// Request interceptor: adjuntar token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: refresh automático en 401 + manejo de errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si no es 401 o ya se intentó refresh, mostrar error y rechazar
    if (error.response?.status !== 401 || originalRequest._retry) {
      // Mostrar toast para errores que no son 401 o ya reintentados
      showErrorToast(error)
      return Promise.reject(error)
    }

    // Prevenir loop infinito
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    // Si ya hay un refresh en progreso, encolar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) {
      isRefreshing = false
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      })

      const { access_token, refresh_token: newRefreshToken, user } = response.data
      useAuthStore.getState().login(access_token, newRefreshToken, user)

      processQueue(null, access_token)

      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// Mapeo de códigos HTTP a mensajes amigables
function showErrorToast(error: any) {
  const status = error.response?.status
  if (!status) return // Sin conexión u otros errores

  // No mostrar toasts para 401 (ya lo maneja el interceptor de refresh)
  if (status === 401) return

  const addToast = useUIStore.getState().addToast

  switch (status) {
    case 400:
      addToast('Datos inválidos. Revisá los campos e intentá de nuevo.', 'error')
      break
    case 403:
      addToast('No tenés permisos para realizar esta acción.', 'error')
      break
    case 404:
      addToast('Recurso no encontrado.', 'error')
      break
    case 429:
      addToast('Demasiadas solicitudes. Esperá un momento e intentá de nuevo.', 'warning')
      break
    case 500:
      addToast('Error interno del servidor. Intentá de nuevo más tarde.', 'error')
      break
    default:
      break
  }
}
