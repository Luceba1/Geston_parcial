import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { adminApi } from '../../lib/adminApi'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function firstDayOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export default function DashboardPage() {
  const [desde, setDesde] = useState(firstDayOfMonthISO())
  const [hasta, setHasta] = useState(todayISO())
  const [granularidad, setGranularidad] = useState('dia')

  const params = { desde, hasta }

  const resumen = useQuery({
    queryKey: ['admin-resumen', desde, hasta],
    queryFn: () => adminApi.getResumen(params),
  })

  const ventas = useQuery({
    queryKey: ['admin-ventas', desde, hasta, granularidad],
    queryFn: () => adminApi.getVentas({ ...params, granularidad }),
  })

  const topProductos = useQuery({
    queryKey: ['admin-top-productos', desde, hasta],
    queryFn: () => adminApi.getTopProductos({ ...params, top: 10 }),
  })

  const pedidosPorEstado = useQuery({
    queryKey: ['admin-pedidos-estado', desde, hasta],
    queryFn: () => adminApi.getPedidosPorEstado(params),
  })

  const isLoading = resumen.isLoading || ventas.isLoading || topProductos.isLoading || pedidosPorEstado.isLoading
  const isError = resumen.isError || ventas.isError || topProductos.isError || pedidosPorEstado.isError

  if (isError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Error al cargar métricas</h3>
          <p className="text-red-600 text-sm mb-4">No se pudieron obtener los datos del dashboard.</p>
          <button
            onClick={() => { resumen.refetch(); ventas.refetch(); topProductos.refetch(); pedidosPorEstado.refetch() }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const data = resumen.data

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde:</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta:</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Ventas"
          value={isLoading ? '...' : formatCurrency(data?.total_ventas ?? 0)}
          subtitle="Período seleccionado"
          color="green"
        />
        <SummaryCard
          title="Pedidos"
          value={isLoading ? '...' : String(data?.cantidad_pedidos ?? 0)}
          subtitle="Completados"
          color="blue"
        />
        <SummaryCard
          title="Usuarios"
          value={isLoading ? '...' : String(data?.cantidad_usuarios ?? 0)}
          subtitle="Registrados"
          color="purple"
        />
        <SummaryCard
          title="Top Producto"
          value={isLoading ? '...' : (data?.productos_mas_vendidos?.[0]?.nombre_snapshot ?? '—')}
          subtitle={`${data?.productos_mas_vendidos?.[0]?.cantidad_total_vendida ?? 0} vendidos`}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Evolution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Evolución de Ventas</h2>
            <select
              value={granularidad}
              onChange={(e) => setGranularidad(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
          {isLoading ? (
            <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventas.data?.items ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="monto_total" stroke="#22c55e" strokeWidth={2} name="Monto Total" />
                <Line type="monotone" dataKey="cantidad_pedidos" stroke="#3b82f6" strokeWidth={2} name="Cant. Pedidos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos Más Vendidos</h2>
          {isLoading ? (
            <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductos.data?.items ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="nombre_snapshot" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cantidad_total_vendida" fill="#22c55e" name="Cant. Vendida" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Orders by State Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Pedidos por Estado</h2>
        {isLoading ? (
          <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pedidosPorEstado.data?.items ?? []}
                  dataKey="cantidad"
                  nameKey="estado_nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                   label={({ estado_nombre, cantidad }: any) => `${estado_nombre}: ${cantidad}`}
                >
                  {(pedidosPorEstado.data?.items ?? []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1 truncate">{value}</p>
      <p className="text-xs opacity-60 mt-1">{subtitle}</p>
    </div>
  )
}
