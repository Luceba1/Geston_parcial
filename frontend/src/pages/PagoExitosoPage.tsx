import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/Button'
import { api } from '../lib/api'
import { usePaymentStore } from '../stores/paymentStore'

type EstadoConfirmacion = 'confirmando' | 'aprobado' | 'rechazado' | 'error' | 'sin_datos'

export default function PagoExitosoPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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
          // pendiente o desconocido
          setPaymentStatus('pending')
          setEstado('sin_datos')
        }
      } catch (err: any) {
        if (cancelled) return
        console.error('Error confirmando pago:', err)
        setEstado('error')
      }
    }

    confirmar()

    return () => {
      cancelled = true
      reset()
    }
  }, [pedidoId, searchParams, setPaymentStatus, reset])

  // ── Auto-redirección 3 segundos después de confirmado ──
  const estadosRedirigibles: EstadoConfirmacion[] = ['aprobado', 'rechazado', 'sin_datos', 'error']
  useEffect(() => {
    if (!estadosRedirigibles.includes(estado)) return

    const timer = setTimeout(() => {
      navigate(`/orders/${pedidoId}`)
    }, 3000)

    return () => clearTimeout(timer)
  }, [estado, pedidoId, navigate])

  // ── Estados de carga ─────────────────────────────
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
          <p className="text-muted-foreground">
            Estamos confirmando el pago con MercadoPago. Esperá un momento.
          </p>
        </div>
      </div>
    )
  }

  // ── Aprobado ──────────────────────────────────────
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
            Tu pago para el pedido <strong>#{id}</strong> fue procesado y confirmado correctamente.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Te llevamos a tu pedido en unos segundos...
          </p>
          <div className="flex justify-center gap-3">
            <Link to={`/orders/${id}`}>
              <Button>Ver pedido ahora</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Rechazado (MP dijo success pero el pago está rechazado) ──
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
            El pago para el pedido <strong>#{id}</strong> fue rechazado por MercadoPago.
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

  // ── Error o sin datos — fallback estático ────────
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
          {estado === 'error'
            ? 'Tu pago fue procesado pero no pudimos verificar el estado automáticamente. Revisá la página del pedido para confirmar.'
            : <>Tu pago para el pedido <strong>#{id}</strong> fue procesado correctamente.</>}
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
