import { Clock, Download, Globe, Inbox, Phone, Printer, Receipt, Search, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ShineBorder } from '@/components/ui/shine-border'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { errorMessage, formatDateTime, formatMoney, NEXT_ACTION } from '@/lib/format'
import { ordersToCsv } from '@/lib/stats'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type Mode = 'board' | 'history'
const COLUMNS: { status: OrderStatus; title: string; empty: string }[] = [
  { status: 'pending', title: 'Recibidos', empty: 'Sin pedidos nuevos' },
  { status: 'preparing', title: 'Preparando', empty: 'Nada en la plancha' },
  { status: 'ready', title: 'Listos', empty: 'Nada esperando entrega' },
]
const WARN_MIN = 8
const LATE_MIN = 15

const minutesSince = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))

function matches(o: Order, q: string) {
  if (!q) return true
  const hay = `${o.id} ${o.customerName} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))
}

interface Props { orders: Order[] | null; fresh: Set<string>; query: string; onQuery: (q: string) => void; onChanged: () => Promise<void> }

export function OrdersTab({ orders, fresh, query, onQuery, onChanged }: Props) {
  const [mode, setMode] = useState<Mode>('board')
  const [col, setCol] = useState<OrderStatus>('pending')
  const [ticket, setTicket] = useState<{ id: string; text: string } | null>(null)
  const [cancelling, setCancelling] = useState<Order | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t) }, [])

  const filtered = useMemo(() => (orders ?? []).filter((o) => matches(o, query)), [orders, query])

  if (!orders) return <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}</div>

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([ordersToCsv(filtered)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length} pedidos exportados`)
  }

  const card = (o: Order) => {
    const next = NEXT_ACTION[o.status]
    const Channel = o.source === 'voice' ? Phone : Globe
    const open = o.status === 'pending' || o.status === 'preparing'
    const mins = minutesSince(o.createdAt, now)
    const tone = !open ? 'outline' : mins >= LATE_MIN ? 'destructive' : mins >= WARN_MIN ? 'secondary' : 'outline'
    return (
      <motion.li key={o.id} layout="position" initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        <Card size="sm" className="relative">
          {fresh.has(o.id) && <ShineBorder shineColor={['var(--primary)', 'var(--secondary)']} borderWidth={2} duration={6} />}
          <CardHeader className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-heading text-base font-bold"><span className="num">{o.id}</span><Channel className="size-3.5 text-muted-foreground" aria-label={o.source === 'voice' ? 'Llamada' : 'Web'} /></p>
              <p className="truncate text-sm text-muted-foreground">{o.customerName}</p>
            </div>
            <Tooltip>
              <TooltipTrigger render={<Badge variant={tone} className="num shrink-0 gap-1" />}><Clock data-icon="inline-start" />{mins < 1 ? 'ahora' : `${mins} min`}</TooltipTrigger>
              <TooltipContent>{formatDateTime(o.createdAt)}</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Separator />
            <ul className="flex flex-col gap-1">
              {o.items.map((it, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold"><span className="num">{it.quantity}×</span> {it.emoji} {it.name}</p>
                  {it.removed.length > 0 && <p className="text-xs font-semibold text-primary">Sin {(it.removedNames?.length ? it.removedNames : it.removed).join(', ')}</p>}
                  {it.extras.length > 0 && <p className="text-xs font-semibold text-leaf">+ {it.extras.map((e) => e.name).join(', ')}</p>}
                  {it.comments && <p className="text-xs text-muted-foreground">Nota: {it.comments}</p>}
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-center gap-1">
              <span className="num mr-auto text-base font-semibold">{formatMoney(o.total)}</span>
              <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Ver ticket" onClick={() => run(async () => setTicket({ id: o.id, text: await api.admin.ticket(o.id) }))} />}><Receipt /></TooltipTrigger><TooltipContent>Ver ticket</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Reimprimir" onClick={() => run(async () => { const r = await api.admin.reprint(o.id); if (!r.print.ok) throw new Error('La impresora no responde') }, 'Ticket enviado a la impresora')} />}><Printer /></TooltipTrigger><TooltipContent>Reimprimir</TooltipContent></Tooltip>
              {(o.status === 'pending' || o.status === 'preparing' || o.status === 'ready') && <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" className="text-destructive" aria-label="Cancelar pedido" onClick={() => setCancelling(o)} />}><XCircle /></TooltipTrigger><TooltipContent>Cancelar pedido</TooltipContent></Tooltip>}
            </div>
          </CardContent>
          <CardFooter className="border-t-0 bg-transparent pb-3">
            {next ? <Button className="w-full" onClick={() => run(() => api.admin.setStatus(o.id, next.to))}>{next.label}</Button> : <StatusBadge status={o.status} className="w-fit" />}
          </CardFooter>
        </Card>
      </motion.li>
    )
  }

  const history = filtered.filter((o) => o.status === 'delivered' || o.status === 'cancelled')

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup value={[mode]} onValueChange={(v) => { if (v[0]) setMode(v[0] as Mode) }} variant="outline" aria-label="Vista de pedidos">
          <ToggleGroupItem value="board" className="px-4">Tablero</ToggleGroupItem>
          <ToggleGroupItem value="history" className="px-4">Historial</ToggleGroupItem>
        </ToggleGroup>
        <InputGroup className="min-w-48 flex-1 sm:max-w-xs">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Pedido, cliente o plato" aria-label="Filtrar pedidos" />
        </InputGroup>
        <Button variant="outline" className="ml-auto" onClick={exportCsv} disabled={filtered.length === 0}><Download data-icon="inline-start" /> <span className="hidden sm:inline">Exportar CSV</span></Button>
      </div>

      {mode === 'board' ? (
        <>
          <ToggleGroup value={[col]} onValueChange={(v) => { if (v[0]) setCol(v[0] as OrderStatus) }} variant="outline" className="w-full lg:hidden" aria-label="Columna">
            {COLUMNS.map((c) => (
              <ToggleGroupItem key={c.status} value={c.status} className="flex-1 gap-1.5">
                {c.title} <span className="num text-xs opacity-80">{filtered.filter((o) => o.status === c.status).length}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {COLUMNS.map((c) => {
              const list = filtered.filter((o) => o.status === c.status).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              return (
                <section key={c.status} aria-label={c.title} className={cn('min-w-0 rounded-2xl bg-muted/60 p-3', col !== c.status && 'hidden lg:block')}>
                  <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide uppercase">
                    {c.title}<span className="num grid min-w-6 place-items-center rounded-full bg-foreground px-1.5 text-xs text-background">{list.length}</span>
                    <span className="num ml-auto text-xs font-semibold text-muted-foreground normal-case">{formatMoney(list.reduce((s, o) => s + o.total, 0))}</span>
                  </h2>
                  <ul className="grid gap-3">
                    <AnimatePresence initial={false}>{list.map(card)}</AnimatePresence>
                  </ul>
                  {list.length === 0 && <Empty className="border border-dashed p-6"><EmptyHeader><EmptyMedia variant="icon"><Inbox /></EmptyMedia><EmptyTitle>{query ? 'Sin coincidencias' : c.empty}</EmptyTitle></EmptyHeader></Empty>}
                </section>
              )
            })}
          </div>
        </>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>{history.map(card)}</AnimatePresence>
          {history.length === 0 && <li className="col-span-full"><Empty className="border border-dashed"><EmptyHeader><EmptyMedia variant="icon"><Inbox /></EmptyMedia><EmptyTitle>Historial vacío</EmptyTitle><EmptyDescription>Nada coincide con este filtro.</EmptyDescription></EmptyHeader></Empty></li>}
        </ul>
      )}

      <Dialog open={!!ticket} onOpenChange={(o) => { if (!o) setTicket(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-xl font-bold">Ticket {ticket?.id}</DialogTitle><DialogDescription>Así sale por la impresora.</DialogDescription></DialogHeader>
          <pre className="max-h-[55dvh] overflow-auto rounded-lg border border-border bg-white p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-900">{ticket?.text}</pre>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelling} onOpenChange={(o) => { if (!o) setCancelling(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">¿Cancelar {cancelling?.id}?</DialogTitle>
            <DialogDescription>Se devuelve el stock de los ingredientes y el cliente verá el pedido como cancelado. No se puede reabrir.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)}>No, mantener</Button>
            <Button variant="destructive" onClick={() => { const o = cancelling; setCancelling(null); if (o) void run(() => api.admin.setStatus(o.id, 'cancelled'), 'Pedido cancelado y stock devuelto') }}>Sí, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
