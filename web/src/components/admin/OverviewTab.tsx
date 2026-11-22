import { AlertTriangle, ChefHat, Receipt, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'
import { Bar, BarChart, Cell, CartesianGrid, XAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Skeleton } from '@/components/ui/skeleton'
import { tileFor } from '@/lib/format'
import { computeStats, delta } from '@/lib/stats'
import type { Ingredient, Order } from '@/lib/types'
import type { View } from './Shell'

interface Props { orders: Order[] | null; ingredients: Ingredient[] | null; onView: (v: View) => void }

const chartConfig = { orders: { label: 'Pedidos', color: 'var(--chart-1)' } } satisfies ChartConfig

function Kpi({ label, value, money, change, hint }: { icon?: typeof Wallet; label: string; value: number; money?: boolean; change?: number | null; hint?: string; delay?: number }) {
  const up = (change ?? 0) >= 0
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <p className="label">{label}</p>
      <p className="num text-3xl font-medium sm:text-4xl">
        {money ? <><NumberTicker value={value} decimalPlaces={2} className="text-foreground" /> €</> : <NumberTicker value={value} className="text-foreground" />}
      </p>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {change != null ? (
          <><span className={up ? 'num font-medium text-leaf' : 'num font-medium text-destructive'}>{up ? '▲' : '▼'} {Math.abs(change)}%</span> vs ayer</>
        ) : hint}
      </p>
    </div>
  )
}

export function OverviewTab({ orders, ingredients, onView }: Props) {
  if (!orders || !ingredients) return <div className="grid gap-4"><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /></div>

  const s = computeStats(orders)
  const inKitchen = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length
  const low = ingredients.filter((i) => i.stock <= i.min_stock).sort((a, b) => a.stock - b.stock)
  const nowH = new Date().getHours()
  const busy = Object.keys(s.byHour).map(Number).filter((h) => s.byHour[h] > 0)
  const lo = Math.min(9, ...busy), hi = Math.max(23, ...busy)
  const data = Array.from({ length: hi - lo + 1 }, (_, i) => ({ hour: lo + i, orders: s.byHour[lo + i] ?? 0 }))
  const topMax = Math.max(1, ...s.top.map((t) => t.qty))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 divide-border border border-foreground bg-card [&>*]:border-b [&>*]:border-dashed [&>*]:border-border xl:grid-cols-4 xl:[&>*]:border-b-0 xl:[&>*:not(:last-child)]:border-r">
        <Kpi delay={0} icon={Wallet} label="Ventas de hoy" value={s.today.revenue} money change={delta(s.today.revenue, s.yesterday.revenue)} hint="Sin datos de ayer" />
        <Kpi delay={0.04} icon={Receipt} label="Pedidos de hoy" value={s.today.orders} change={delta(s.today.orders, s.yesterday.orders)} hint={s.cancelled ? `${s.cancelled} cancelados` : 'Ninguno cancelado'} />
        <Kpi delay={0.08} icon={TrendingUp} label="Ticket medio" value={s.today.avg} money hint="Por pedido, sin cancelados" />
        <Kpi delay={0.12} icon={ChefHat} label="En cocina ahora" value={inKitchen} hint={inKitchen ? 'Recibidos o preparando' : 'Cocina al día'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos por hora</CardTitle>
            <CardDescription>Hoy, hora a hora. La hora actual va resaltada.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={data} margin={{ top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(h) => `${h}h`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(_, p) => `${p?.[0]?.payload?.hour}:00`} />} />
                <Bar dataKey="orders" radius={4} animationDuration={400}>
                  {data.map((d) => <Cell key={d.hour} fill={d.hour === nowH ? 'var(--primary)' : 'var(--color-orders)'} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Más vendidos hoy</CardTitle><CardDescription>Unidades servidas.</CardDescription></CardHeader>
          <CardContent>
            {s.top.length === 0 ? (
              <Empty className="p-4">
                <EmptyHeader><EmptyMedia variant="icon"><ShoppingBag /></EmptyMedia><EmptyTitle>Sin ventas todavía</EmptyTitle><EmptyDescription>Aparecerán aquí en cuanto entre el primer pedido.</EmptyDescription></EmptyHeader>
              </Empty>
            ) : (
              <ol className="flex flex-col gap-3">
                {s.top.map((t) => (
                  <li key={t.name} className="flex flex-col gap-1.5">
                    <p className="flex items-center gap-2 text-sm font-semibold"><span className="border border-border grid size-8 place-items-center rounded-lg text-base" style={{ backgroundColor: tileFor(t.name) }} aria-hidden>{t.emoji}</span><span className="flex-1 truncate">{t.name}</span><span className="num">{t.qty}</span></p>
                    <Progress value={(t.qty / topMax) * 100} aria-label={`${t.name}: ${t.qty}`} />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {low.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-primary" aria-hidden /> Por reponer</CardTitle>
            <CardAction><Button size="sm" variant="outline" onClick={() => onView('inventory')}>Ir al inventario</Button></CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {low.map((i) => <li key={i.id}><Badge variant={i.stock <= 0 ? 'destructive' : 'secondary'} className="num h-7 px-3 text-sm">{i.emoji} {i.name}: {i.stock} {i.unit}</Badge></li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
