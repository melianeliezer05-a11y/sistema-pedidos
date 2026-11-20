import { BookOpen, Boxes, ChefHat, History, LayoutDashboard, LogOut, Moon, Search, Settings, Store, Sun, Volume2, VolumeX, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export type View = 'overview' | 'orders' | 'inventory' | 'products' | 'movements' | 'settings'

export const VIEWS: { id: View; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Resumen', short: 'Resumen', icon: LayoutDashboard },
  { id: 'orders', label: 'Pedidos', short: 'Pedidos', icon: ChefHat },
  { id: 'inventory', label: 'Inventario', short: 'Stock', icon: Boxes },
  { id: 'products', label: 'Carta', short: 'Carta', icon: BookOpen },
  { id: 'movements', label: 'Movimientos', short: 'Historial', icon: History },
  { id: 'settings', label: 'Ajustes', short: 'Ajustes', icon: Settings },
]

interface Props {
  view: View
  onView: (v: View) => void
  badges: Partial<Record<View, { n: number; hot?: boolean }>>
  user: string
  name: string
  live: boolean
  sound: boolean
  onSound: () => void
  onPalette: () => void
  onLogout: () => void
  children: ReactNode
}

export function Shell({ view, onView, badges, user, name, live, sound, onSound, onPalette, onLogout, children }: Props) {
  const { isDark, toggle } = useTheme()
  const current = VIEWS.find((v) => v.id === view)!

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 z-30 hidden h-dvh flex-col bg-rail text-rail-foreground lg:flex">
        <div className="flex items-center gap-2.5 border-b border-rail-border px-5 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-lg" aria-hidden>🔥</span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base leading-tight font-extrabold">{name}</p>
            <p className="text-xs text-rail-muted">Panel de cocina</p>
          </div>
        </div>
        <nav aria-label="Secciones" className="grid gap-1 p-3">
          {VIEWS.map((v, i) => {
            const b = badges[v.id]
            const on = v.id === view
            return (
              <button key={v.id} onClick={() => onView(v.id)} aria-current={on ? 'page' : undefined}
                className={cn('flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors', on ? 'bg-rail-active text-rail-foreground' : 'text-rail-muted hover:bg-rail-active/60 hover:text-rail-foreground')}>
                <v.icon className="size-[1.125rem]" aria-hidden />
                <span className="flex-1 text-left">{v.label}</span>
                {b && b.n > 0 && <span className={cn('num grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold', b.hot ? 'bg-primary text-primary-foreground' : 'bg-rail-foreground/15')}>{b.n}</span>}
                <span className="kbd border-rail-border text-rail-muted" aria-hidden>{i + 1}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto grid gap-1 border-t border-rail-border p-3">
          <Link to="/" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-rail-muted transition-colors hover:bg-rail-active/60 hover:text-rail-foreground"><Store className="size-[1.125rem]" aria-hidden /> Ver carta</Link>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-rail-active text-sm font-bold uppercase" aria-hidden>{user.slice(0, 1) || '?'}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user || '…'}</span>
            <button onClick={onLogout} aria-label="Cerrar sesión" className="grid size-9 place-items-center rounded-lg text-rail-muted transition-colors hover:bg-rail-active hover:text-rail-foreground"><LogOut className="size-4" aria-hidden /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur lg:h-16 lg:px-8">
          <h1 className="font-heading text-xl font-extrabold lg:text-2xl">{current.label}</h1>
          <span role="status" className="ml-2 flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <span className={cn('size-2 rounded-full', live ? 'bg-leaf' : 'bg-destructive')} aria-hidden /><span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{live ? 'En vivo' : 'Sin conexión'}</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" onClick={onPalette} className="hidden w-56 justify-start gap-2 text-muted-foreground sm:flex">
              <Search aria-hidden /> <span className="flex-1 text-left font-medium">Buscar o ir a…</span><span className="kbd">Ctrl K</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onPalette} aria-label="Buscar o ir a" className="sm:hidden"><Search aria-hidden /></Button>
            <Button variant="ghost" size="icon" onClick={onSound} aria-label={sound ? 'Silenciar avisos' : 'Activar sonido de avisos'} aria-pressed={sound}>{sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}</Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label={isDark ? 'Tema claro' : 'Tema oscuro'}>{isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}</Button>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión" className="lg:hidden"><LogOut aria-hidden /></Button>
          </div>
        </header>
        <main className="mx-auto max-w-[88rem] px-4 py-5 lg:px-8 lg:py-6">{children}</main>
      </div>

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-rail-border bg-rail text-rail-foreground lg:hidden">
        {VIEWS.map((v) => {
          const b = badges[v.id]
          const on = v.id === view
          return (
            <button key={v.id} onClick={() => onView(v.id)} aria-current={on ? 'page' : undefined}
              className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors', on ? 'text-secondary' : 'text-rail-muted')}>
              <v.icon className="size-5" aria-hidden />{v.short}
              {b && b.n > 0 && <span className={cn('num absolute top-1.5 right-1/2 -mr-5 grid min-w-4 place-items-center rounded-full px-1 text-[0.625rem] font-bold', b.hot ? 'bg-primary text-primary-foreground' : 'bg-rail-foreground/20')}>{b.n}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
