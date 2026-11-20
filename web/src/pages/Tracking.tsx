import { Check, ChefHat, ChevronLeft, ClipboardCheck, PackageCheck, XCircle, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api, ApiError } from '@/lib/api'
import { errorMessage, formatMoney, STATUS_FLOW, STATUS_LABEL } from '@/lib/format'
import type { OrderStatus, OrderStatusView } from '@/lib/types'
import { cn } from '@/lib/utils'

export const LAST_ORDER_KEY = 'pedidos.lastOrder'

const ICON: Record<OrderStatus, LucideIcon> = { pending: ClipboardCheck, preparing: ChefHat, ready: PackageCheck, delivered: Check, cancelled: XCircle }
const MESSAGE: Record<OrderStatus, string> = {
  pending: 'Hemos recibido tu pedido. En un momento lo ven en cocina.',
  preparing: 'Ya lo estamos preparando.',
  ready: '¡Listo! Recógelo en barra.',
  delivered: 'Entregado. ¡Que aproveche!',
  cancelled: 'Este pedido se ha cancelado. Si no esperabas esto, avisa en barra.',
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
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <Button variant="ghost" nativeButton={false} render={<Link to="/" />} className="-ml-2"><ChevronLeft aria-hidden /> Volver a la carta</Button>

      {missing ? (
        <div className="mt-10 text-center">
          <h1 className="text-3xl font-bold">No encontramos ese pedido</h1>
          <p className="mt-2 text-muted-foreground">Revisa el enlace o haz un pedido nuevo.</p>
        </div>
      ) : !order ? (
        <div className="mt-8 grid gap-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-32" /></div>
      ) : (
        <>
          <p className="mt-6 text-sm font-bold tracking-wide text-muted-foreground uppercase">Pedido <span className="num">{order.id}</span></p>
          <h1 className="mt-1 text-4xl leading-tight font-extrabold" aria-live="polite">{STATUS_LABEL[order.status]}</h1>
          <p className="mt-2 text-lg text-muted-foreground" aria-live="polite">{MESSAGE[order.status]}</p>

          {status !== 'cancelled' && (
            <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Progreso del pedido">
              {STATUS_FLOW.map((s, i) => {
                const Icon = ICON[s]
                const done = i <= step
                return (
                  <li key={s} className="grid justify-items-center gap-2 text-center" aria-current={i === step ? 'step' : undefined}>
                    <motion.span
                      animate={{ scale: i === step ? 1.12 : 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={cn('grid size-12 place-items-center rounded-full border-2 border-foreground', done ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
                    >
                      <Icon className="size-5" aria-hidden />
                    </motion.span>
                    <span className={cn('text-xs font-bold', done ? 'text-foreground' : 'text-muted-foreground')}>{STATUS_LABEL[s]}</span>
                  </li>
                )
              })}
            </ol>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-muted-foreground">Sin conexión, reintentando… ({error})</p>}

          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">Tu pedido</h2>
            <ul className="grid gap-2">
              {order.items.map((it, i) => (
                <li key={i} className="flex gap-3"><span aria-hidden>{it.emoji}</span><span className="num font-bold">{it.quantity}×</span><span>{it.name}</span></li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-dashed border-border pt-3 text-lg font-extrabold"><span>Total</span><span className="num">{formatMoney(order.total)}</span></p>
          </section>
        </>
      )}
    </main>
  )
}
