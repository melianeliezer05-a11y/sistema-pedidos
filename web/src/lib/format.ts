import type { OrderStatus } from './types'

const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' })
export const formatMoney = (n: number) => money.format(n)

const dateTime = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 45) return 'ahora'
  const m = Math.round(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return formatDateTime(iso)
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Recibido',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

export const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: 'preparing', label: 'Empezar a preparar' },
  preparing: { to: 'ready', label: 'Marcar listo' },
  ready: { to: 'delivered', label: 'Marcar entregado' },
}

/** Color de baldosa estable por producto (4 tonos de la paleta). */
export function tileFor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `var(--tile-${(h % 4) + 1})`
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Algo ha fallado')
