import type { Order } from './types'

export interface DayStats { orders: number; revenue: number; avg: number }
export interface Stats {
  today: DayStats
  yesterday: DayStats
  cancelled: number
  byHour: number[]
  top: { name: string; emoji: string; qty: number; revenue: number }[]
}

const empty = (): DayStats => ({ orders: 0, revenue: 0, avg: 0 })
const finish = (d: DayStats): DayStats => ({ ...d, avg: d.orders ? d.revenue / d.orders : 0 })

/** Cuenta ventas (no canceladas) de hoy y ayer según la hora local del navegador. */
export function computeStats(orders: Order[], now = new Date()): Stats {
  const today = empty(); const yesterday = empty()
  const byHour = Array<number>(24).fill(0)
  const dishes = new Map<string, { name: string; emoji: string; qty: number; revenue: number }>()
  let cancelled = 0
  const y = new Date(now); y.setDate(y.getDate() - 1)
  for (const o of orders) {
    const d = new Date(o.createdAt)
    const isToday = d.toDateString() === now.toDateString()
    const isYesterday = d.toDateString() === y.toDateString()
    if (o.status === 'cancelled') { if (isToday) cancelled++; continue }
    if (isToday) {
      today.orders++; today.revenue += o.total; byHour[d.getHours()]++
      for (const l of o.items) {
        const cur = dishes.get(l.productId) ?? { name: l.name, emoji: l.emoji, qty: 0, revenue: 0 }
        cur.qty += l.quantity; cur.revenue += l.lineTotal; dishes.set(l.productId, cur)
      }
    } else if (isYesterday) { yesterday.orders++; yesterday.revenue += o.total }
  }
  return { today: finish(today), yesterday: finish(yesterday), cancelled, byHour, top: [...dishes.values()].sort((a, b) => b.qty - a.qty).slice(0, 5) }
}

/** Variación porcentual, o null si no hay base de comparación. */
export const delta = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null)

export function ordersToCsv(orders: Order[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ['id', 'fecha', 'cliente', 'canal', 'estado', 'total', 'platos']
  const rows = orders.map((o) => [o.id, o.createdAt, o.customerName, o.source, o.status, o.total.toFixed(2), o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | ')])
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}
