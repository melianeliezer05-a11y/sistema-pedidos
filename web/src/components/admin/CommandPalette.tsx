import { CornerDownLeft, LogOut, Moon, Receipt, Sun, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatMoney, STATUS_LABEL } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import { VIEWS, type View } from './Shell'

interface Item { id: string; label: string; hint?: string; icon: ComponentType<{ className?: string }>; run: () => void }

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  orders: Order[] | null
  onView: (v: View) => void
  onOrder: (id: string) => void
  onSound: () => void
  onLogout: () => void
}

export function CommandPalette({ open, onOpenChange, orders, onView, onOrder, onSound, onLogout }: Props) {
  const { isDark, toggle } = useTheme()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => { if (open) { setQ(''); setIdx(0) } }, [open])

  const items = useMemo<Item[]>(() => {
    const done = (fn: () => void) => () => { onOpenChange(false); fn() }
    const nav: Item[] = VIEWS.map((v, i) => ({ id: `v-${v.id}`, label: `Ir a ${v.label}`, hint: String(i + 1), icon: v.icon, run: done(() => onView(v.id)) }))
    const actions: Item[] = [
      { id: 'a-theme', label: isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro', icon: isDark ? Sun : Moon, run: done(toggle) },
      { id: 'a-sound', label: 'Activar o silenciar el sonido', icon: Volume2, run: done(onSound) },
      { id: 'a-out', label: 'Cerrar sesión', icon: LogOut, run: done(onLogout) },
    ]
    const found: Item[] = (orders ?? []).slice(0, 60).map((o) => ({
      id: `o-${o.id}`, label: `${o.id} · ${o.customerName}`, hint: `${STATUS_LABEL[o.status]} · ${formatMoney(o.total)}`, icon: Receipt, run: done(() => onOrder(o.id)),
    }))
    const all = [...nav, ...actions, ...found]
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const hay = (i: Item) => `${i.label} ${i.hint ?? ''} ${i.id.startsWith('o-') ? (orders?.find((o) => `o-${o.id}` === i.id)?.items.map((x) => x.name).join(' ') ?? '') : ''}`.toLowerCase()
    return terms.length ? all.filter((i) => terms.every((t) => hay(i).includes(t))).slice(0, 12) : [...nav, ...actions, ...found.slice(0, 4)]
  }, [q, orders, isDark, toggle, onOpenChange, onView, onOrder, onSound, onLogout])

  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [idx])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[idx]?.run() }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Buscar o ir a</DialogTitle>
        <DialogDescription className="sr-only">Escribe para buscar un pedido, ir a una sección o ejecutar una acción.</DialogDescription>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} role="combobox" aria-expanded aria-controls="cmd-list" aria-activedescendant={items[idx]?.id}
          placeholder="Pedido, cliente, plato o acción…" className="h-14 w-full border-b border-border bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground" />
        <ul id="cmd-list" ref={list} role="listbox" className="max-h-80 overflow-y-auto p-2">
          {items.map((it, i) => (
            <li key={it.id} id={it.id} role="option" aria-selected={i === idx} onMouseMove={() => setIdx(i)} onClick={it.run}
              className={cn('flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-semibold', i === idx && 'bg-muted')}>
              <it.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{it.label}</span>
              {it.hint && (it.hint.length === 1 ? <span className="kbd">{it.hint}</span> : <span className="num text-xs font-medium text-muted-foreground">{it.hint}</span>)}
              {i === idx && <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />}
            </li>
          ))}
          {items.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Nada coincide con «{q}».</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
