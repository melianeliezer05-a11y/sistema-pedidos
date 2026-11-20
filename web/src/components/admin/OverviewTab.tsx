import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChefHat, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney, tileFor } from '@/lib/format'
import { computeStats, delta } from '@/lib/stats'
import type { Ingredient, Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { View } from './Shell'

interface Props { orders: Order[] | null; ingredients: Ingredient[] | null; onView: (v: View) => void }

function Kpi({ icon: Icon, label, value, change, hint }: { icon: typeof Wallet; label: string; value: string; change?: number | null; hint?: string }) {
  const up = (change ?? 0) >= 0
  return (
    <div className="grid gap-1.5 rounded-2xl border border-border bg-card p-3.5 sm:gap-2 sm:p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:gap-2 sm:text-sm"><Icon className="size-4" aria-hidden /> {label}</p>
      <p className="num font-heading text-2xl leading-none sm:text-3xl font-extrabold">{value}</p>
      <p className="min-h-5 text-xs text-muted-foreground sm:text-sm">
        {change != null
          ? <span className={cn('num inline-flex items-center gap-0.5 font-bold', up ? 'text-leaf' : 'text-destructive')}>{up ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}{Math.abs(change)}%<span className="ml-1 font-medium text-muted-foreground">vs ayer</span></span>
          : hint}
      </p>
    </div>
  )
}

export function OverviewTab({ orders, ingredients, onView }: Props) {
  if (!orders || !ingredients) return <div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div><Skeleton className="h-72 rounded-2xl" /></div>

  const s = computeStats(orders)
  const inKitchen = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length
  const low = ingredients.filter((i) => i.stock <= i.min_stock).sort((a, b) => a.stock - b.stock)
  const hours = Array.from({ length: 15 }, (_, i) => i + 9)
  const max = Math.max(1, ...hours.map((h) => s.byHour[h]))
  const nowH = new Date().getHours()
  const topMax = Math.max(1, ...s.top.map((t) => t.qty))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Ventas de hoy" value={formatMoney(s.today.revenue)} change={delta(s.today.revenue, s.yesterday.revenue)} hint="Sin datos de ayer" />
        <Kpi icon={Receipt} label="Pedidos de hoy" value={String(s.today.orders)} change={delta(s.today.orders, s.yesterday.orders)} hint={s.cancelled ? `${s.cancelled} cancelados` : 'Ninguno cancelado'} />
        <Kpi icon={TrendingUp} label="Ticket medio" value={formatMoney(s.today.avg)} hint="Por pedido, sin cancelados" />
        <Kpi icon={ChefHat} label="En cocina ahora" value={String(inKitchen)} hint={inKitchen ? 'Recibidos o preparando' : 'Cocina al día'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2" aria-labelledby="h-hours">
          <h2 id="h-hours" className="text-lg font-bold">Pedidos por hora</h2>
          <p className="text-sm text-muted-foreground">Hoy, de 9:00 a 23:00.</p>
          <div className="mt-5 flex h-44 items-end gap-1.5" role="img" aria-label={`Pedidos por hora: ${hours.map((h) => `${h}h ${s.byHour[h]}`).join(', ')}`}>
            {hours.map((h) => (
              <div key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="num text-xs font-bold text-muted-foreground">{s.byHour[h] || ''}</span>
                <div className={cn('w-full rounded-t-md', s.byHour[h] ? (h === nowH ? 'bg-primary' : 'bg-foreground/80') : 'bg-border')} style={{ height: `${s.byHour[h] ? Math.max(8, (s.byHour[h] / max) * 100) : 3}%` }} />
                <span className={cn('num text-[0.6875rem] font-semibold', h === nowH ? 'text-primary' : 'text-muted-foreground')}>{h}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="h-top">
          <h2 id="h-top" className="text-lg font-bold">Más vendidos hoy</h2>
          {s.top.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Todavía no hay ventas hoy.</p> : (
            <ol className="mt-4 grid gap-3">
              {s.top.map((t) => (
                <li key={t.name} className="grid gap-1.5">
                  <p className="flex items-center gap-2 text-sm font-semibold"><span className="sticker grid size-8 place-items-center rounded-lg text-base" style={{ backgroundColor: tileFor(t.name) }} aria-hidden>{t.emoji}</span><span className="flex-1 truncate">{t.name}</span><span className="num">{t.qty}</span></p>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(t.qty / topMax) * 100}%` }} /></div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {low.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="h-low">
          <div className="flex items-center gap-2">
            <h2 id="h-low" className="flex items-center gap-2 text-lg font-bold"><AlertTriangle className="size-5 text-primary" aria-hidden /> Por reponer</h2>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => onView('inventory')}>Ir al inventario</Button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {low.map((i) => <li key={i.id} className={cn('num rounded-full px-3 py-1 text-sm font-semibold', i.stock <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground')}>{i.emoji} {i.name}: {i.stock} {i.unit}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
