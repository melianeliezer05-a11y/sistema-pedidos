import { LogOut, Moon, Receipt, Sun, Volume2 } from 'lucide-react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { formatMoney, STATUS_LABEL } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import type { Order } from '@/lib/types'
import { VIEWS, type View } from './Shell'

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
  const done = (fn: () => void) => () => { onOpenChange(false); fn() }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar o ir a" description="Busca un pedido, ve a una sección o ejecuta una acción.">
      <CommandInput placeholder="Pedido, cliente, plato o acción…" />
      <CommandList>
        <CommandEmpty>Nada coincide con tu búsqueda.</CommandEmpty>
        <CommandGroup heading="Ir a">
          {VIEWS.map((v, i) => (
            <CommandItem key={v.id} value={`ir a ${v.label}`} onSelect={done(() => onView(v.id))}>
              <v.icon /><span>{v.label}</span><CommandShortcut>{i + 1}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem value="cambiar tema claro oscuro" onSelect={done(toggle)}>{isDark ? <Sun /> : <Moon />}<span>{isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}</span></CommandItem>
          <CommandItem value="sonido avisos silenciar activar" onSelect={done(onSound)}><Volume2 /><span>Activar o silenciar el sonido</span></CommandItem>
          <CommandItem value="cerrar sesion salir" onSelect={done(onLogout)}><LogOut /><span>Cerrar sesión</span></CommandItem>
        </CommandGroup>
        {(orders?.length ?? 0) > 0 && <CommandSeparator />}
        <CommandGroup heading="Pedidos">
          {(orders ?? []).slice(0, 60).map((o) => (
            <CommandItem key={o.id} value={`${o.id} ${o.customerName} ${o.items.map((x) => x.name).join(' ')}`} onSelect={done(() => onOrder(o.id))}>
              <Receipt /><span className="flex-1 truncate">{o.id} · {o.customerName}</span>
              <CommandShortcut className="num">{STATUS_LABEL[o.status]} · {formatMoney(o.total)}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
