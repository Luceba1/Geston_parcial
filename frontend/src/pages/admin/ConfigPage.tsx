import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/adminApi'
import { useUIStore } from '../../stores/uiStore'

interface ConfigItem {
  clave: string
  valor: string
  updated_by: string | null
  updated_at: string | null
}

export default function ConfigPage() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const { data: configs, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => adminApi.getConfig(),
  })

  useEffect(() => {
    if (configs) {
      const values: Record<string, string> = {}
      configs.forEach((c: ConfigItem) => { values[c.clave] = c.valor })
      setEditValues((prev) => {
        // Only set if prev is empty (first load)
        if (Object.keys(prev).length === 0) return values
        return prev
      })
    }
  }, [configs])

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config'] })
      addToast('Configuración actualizada correctamente', 'success')
    },
    onError: () => {
      addToast('Error al guardar la configuración', 'error')
    },
  })

  const handleSave = () => {
    saveMutation.mutate(editValues)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Error al cargar configuración</h3>
          <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
        >
          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {(configs ?? []).length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg font-medium">Sin configuraciones</p>
            <p className="text-sm mt-1">No hay configuraciones del sistema todavía. Agregalas vía API.</p>
          </div>
        ) : (
          (configs ?? []).map((config: ConfigItem) => (
            <div key={config.clave} className="p-4 sm:flex sm:items-start sm:gap-4">
              <div className="sm:w-1/3 mb-2 sm:mb-0">
                <label className="block text-sm font-medium text-gray-700">{config.clave}</label>
                {config.updated_by && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Última modificación: {config.updated_by}
                    {config.updated_at && ` — ${new Date(config.updated_at).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <div className="sm:w-2/3">
                <textarea
                  value={editValues[config.clave] ?? config.valor}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, [config.clave]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
