import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api, ApiError } from '@/lib/api'
import { errorMessage, formatMoney, STATUS_FLOW, STATUS_LABEL } from '@/lib/format'
import type { OrderStatus, OrderStatusView } from '@/lib/types'
import { cn } from '@/lib/utils'

export const LAST_ORDER_KEY = 'pedidos.lastOrder'

const MESSAGE: Record<OrderStatus, string> = {
  pending: 'Recibido. En un momento lo ven en cocina.',
  preparing: 'En la plancha.',
  ready: 'Listo. Recógelo en barra.',
  delivered: 'Entregado. Que aproveche.',
  cancelled: 'Pedido cancelado. Si no lo esperabas, avisa en barra.',
}

export default function Tracking() {
  const { id = '' } = useParams()
  const [order, setOrder] = useState<OrderStatusView | null>(null)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let stop = false
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      try {
        const o = await api.orderStatus(id)
        if (stop) return
        setOrder(o); setError('')
        if (o.status === 'delivered' || o.status === 'cancelled') return
      } catch (e) {
        if (stop) return
        if (e instanceof ApiError && e.status === 404) { setMissing(true); return }
        setError(errorMessage(e))
      }
      timer = setTimeout(tick, 5000)
    }
    void tick()
    return () => { stop = true; clearTimeout(timer) }
  }, [id])

  const status = order?.status
  const step = status ? STATUS_FLOW.indexOf(status) : -1

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/" />} className="-ml-2"><ChevronLeft data-icon="inline-start" /> Carta</Button>

      {missing ? (
        <div className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">Pedido no encontrado</h1>
          <p className="mt-2 text-muted-foreground">Revisa el enlace o haz un pedido nuevo.</p>
        </div>
      ) : !order ? (
        <div className="mt-8 grid gap-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>
      ) : (
        <div className="mt-6 border border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]">
          <div className="px-5 pt-5">
            <p className="label">Pedido</p>
            <p className="num text-5xl font-medium">{order.id}</p>
          </div>

          <div className="px-5 py-6">
            <h1 className="text-3xl font-semibold tracking-tight" aria-live="polite">{STATUS_LABEL[order.status]}</h1>
            <p className="mt-1 text-muted-foreground" aria-live="polite">{MESSAGE[order.status]}</p>
            {status !== 'cancelled' && (
              <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Progreso del pedido">
                {STATUS_FLOW.map((s, i) => (
                  <li key={s} aria-current={i === step ? 'step' : undefined}>
                    <span className={cn('block h-2 transition-colors duration-[var(--duration-fast)]', i <= step ? (i === step ? 'bg-signal' : 'bg-foreground') : 'bg-border')} />
                    <span className={cn('label mt-1.5 block', i === step && 'text-foreground')}>{STATUS_LABEL[s]}</span>
                  </li>
                ))}
              </ol>
            )}
            {error && <p role="alert" className="mt-4 text-sm text-muted-foreground">Sin conexión, reintentando… ({error})</p>}
          </div>

          <ul className="border-t border-dashed border-border px-5 py-3">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-3 py-1.5"><span className="num w-8 text-muted-foreground">{it.quantity}×</span><span className="flex-1">{it.emoji} {it.name}</span></li>
            ))}
          </ul>
          <div className="mx-5 flex items-baseline justify-between border-t-2 border-foreground py-4">
            <span className="label">Total</span><span className="num text-2xl font-medium">{formatMoney(order.total)}</span>
          </div>
          <div className="tear" aria-hidden />
        </div>
      )}
    </main>
  )
}
