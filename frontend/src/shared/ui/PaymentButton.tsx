import { useState } from 'react'
import { api } from '../../lib/api'
import { usePaymentStore } from '../../stores/paymentStore'
import { useUIStore } from '../../stores/uiStore'

const VITE_MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY

interface PaymentButtonProps {
  pedidoId: number
  monto: number
  disabled?: boolean
  pagoEstado?: string | null
}

export function PaymentButton({ pedidoId, monto, disabled, pagoEstado }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const { setPreferenceId, setInitPoint, setPaymentStatus } = usePaymentStore()

  const mpConfigured = !!VITE_MP_PUBLIC_KEY
  const esReintento = pagoEstado === 'rechazado'

  const handlePagar = async () => {
    if (!mpConfigured) {
      addToast(
        'MercadoPago no está configurado. El administrador debe configurar las credenciales.',
        'warning'
      )
      return
    }

    setLoading(true)
    try {
      const endpoint = esReintento
        ? `/pagos/${pedidoId}/reintentar`
        : '/pagos/crear'
      const body = esReintento ? undefined : { pedido_id: pedidoId }

      const res = await api.post(endpoint, body)
      const { preference_id, init_point } = res.data

      setPreferenceId(preference_id)
      setInitPoint(init_point)
      setPaymentStatus('pending')

      // Redirigir a MercadoPago
      if (init_point) {
        window.location.href = init_point
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Error al iniciar el pago'
      addToast(detail, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!mpConfigured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        <p className="font-medium">MercadoPago no disponible</p>
        <p className="mt-1 text-xs">
          El administrador debe configurar las credenciales de MercadoPago.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePagar}
        disabled={loading || disabled}
        className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Conectando con MercadoPago...
          </span>
        ) : esReintento ? (
          `Reintentar pago por $${monto.toFixed(2)}`
        ) : (
          `Pagar $${monto.toFixed(2)} con MercadoPago`
        )}
      </button>
      {esReintento && (
        <p className="text-center text-xs text-amber-600">
          El pago anterior fue rechazado. Estás generando uno nuevo.
        </p>
      )}
      {!esReintento && (
        <p className="text-center text-xs text-gray-400">
          Pago seguro vía MercadoPago
        </p>
      )}
    </div>
  )
}
