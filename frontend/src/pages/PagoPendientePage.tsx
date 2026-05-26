import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../shared/ui/Button'
import { api } from '../lib/api'
import { usePaymentStore } from '../stores/paymentStore'

type EstadoConfirmacion = 'confirmando' | 'pendiente' | 'aprobado' | 'rechazado' | 'error' | 'sin_datos'

export default function PagoPendientePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [estado, setEstado] = useState<EstadoConfirmacion>('confirmando')
  const { setPaymentStatus, reset } = usePaymentStore()
  const pedidoId = Number(id)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    let cancelled = false

    async function confirmar() {
      try {
        const body: Record<string, any> = { pedido_id: pedidoId }
        if (paymentId) {
          body.payment_id = Number(paymentId)
        }
        const res = await api.post('/pagos/confirmar', body)
        const data = res.data

        if (cancelled) return

        if (data.estado === 'aprobado') {
          setPaymentStatus('approved')
          setEstado('aprobado')
        } else if (data.estado === 'rechazado') {
          setPaymentStatus('rejected')
          setEstado('rechazado')
        } else {
          setPaymentStatus('pending')
          setEstado('pendiente')
        }
      } catch (error) {
        console.error('Error confirmando pago:', error)
        if (cancelled) return
        setEstado('sin_datos')
      }
    }

    confirmar()

    return () => {
      cancelled = true
      reset()
    }
  }, [pedidoId, searchParams, setPaymentStatus, reset])

  // ── Confirmando ──
  if (estado === 'confirmando') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-10 w-10 animate-spin text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Verificando pago...</h1>
          <p className="text-muted-foreground">Estamos consultando el estado del pago con MercadoPago.</p>
        </div>
      </div>
    )
  }

  // ── Aprobado (sorpresa) ──
  if (estado === 'aprobado') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">¡Pago exitoso!</h1>
          <p className="mb-6 text-muted-foreground">
            El pago para el pedido <strong>#{id}</strong> fue procesado correctamente.
          </p>
          <div className="flex justify-center gap-3">
            <Link to={`/orders/${id}`}>
              <Button>Ver pedido</Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline">Mis pedidos</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Rechazado ──
  if (estado === 'rechazado') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Pago rechazado</h1>
          <p className="mb-6 text-muted-foreground">
            El pago para el pedido <strong>#{id}</strong> fue rechazado.
            Podés intentar nuevamente con otro medio de pago.
          </p>
          <div className="flex justify-center gap-3">
            <Link to={`/orders/${id}`}>
              <Button>Reintentar pago</Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline">Mis pedidos</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Pendiente o sin datos ──
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Pago en proceso</h1>
        <p className="mb-6 text-muted-foreground">
          El pago para el pedido <strong>#{id}</strong> está siendo procesado.
          Esto puede tomar unos minutos. Te recomendamos revisar el estado del pedido más tarde.
        </p>
        <div className="flex justify-center gap-3">
          <Link to={`/orders/${id}`}>
            <Button>Ver pedido</Button>
          </Link>
          <Link to="/orders">
            <Button variant="outline">Mis pedidos</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
