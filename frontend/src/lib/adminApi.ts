import { api } from './api'

/**
 * API helper para endpoints de administración (/api/admin/*).
 * Reutiliza la misma instancia de axios (con interceptors de auth y refresh)
 * pero antepone el prefijo /api/admin.
 */

const ADMIN_PREFIX = 'http://localhost:8000/api/admin'

export const adminApi = {
  // ─── Usuarios ──────────────────────────────────
  listUsers: (params?: { q?: string; rol?: string; skip?: number; limit?: number }) =>
    api.get(`${ADMIN_PREFIX}/usuarios`, { params }).then((r) => r.data),

  updateUser: (id: number, data: { nombre?: string; telefono?: string; roles?: string[] }) =>
    api.put(`${ADMIN_PREFIX}/usuarios/${id}`, data).then((r) => r.data),

  toggleUserStatus: (id: number, activo: boolean) =>
    api.patch(`${ADMIN_PREFIX}/usuarios/${id}/estado`, { activo }).then((r) => r.data),

  // ─── Métricas ──────────────────────────────────
  getResumen: (params?: { desde?: string; hasta?: string }) =>
    api.get(`${ADMIN_PREFIX}/metricas/resumen`, { params }).then((r) => r.data),

  getVentas: (params?: { desde?: string; hasta?: string; granularidad?: string }) =>
    api.get(`${ADMIN_PREFIX}/metricas/ventas`, { params }).then((r) => r.data),

  getTopProductos: (params?: { top?: number; desde?: string; hasta?: string }) =>
    api.get(`${ADMIN_PREFIX}/metricas/productos-top`, { params }).then((r) => r.data),

  getPedidosPorEstado: (params?: { desde?: string; hasta?: string }) =>
    api.get(`${ADMIN_PREFIX}/metricas/pedidos-por-estado`, { params }).then((r) => r.data),

  // ─── Configuración ─────────────────────────────
  getConfig: () =>
    api.get(`${ADMIN_PREFIX}/configuracion`).then((r) => r.data),

  updateConfig: (configs: Record<string, string>) =>
    api.put(`${ADMIN_PREFIX}/configuracion`, { configs }).then((r) => r.data),
}
