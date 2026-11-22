import { BookOpen, Boxes, ChefHat, History, LayoutDashboard, LogOut, Moon, Search, Settings, Store, Sun, Volume2, VolumeX, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

function IconTip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function Shell({ view, onView, badges, user, name, live, sound, onSound, onPalette, onLogout, children }: Props) {
  const { isDark, toggle } = useTheme()
  const current = VIEWS.find((v) => v.id === view)!

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="[&_[data-slot=sidebar-inner]]:bg-sidebar">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="pointer-events-none">
                  <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg bg-secondary text-lg">◼</AvatarFallback></Avatar>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-heading text-base font-semibold">{name}</span>
                    <span className="truncate text-xs text-rail-muted">Panel de cocina</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {VIEWS.map((v, i) => {
                    const b = badges[v.id]
                    return (
                      <SidebarMenuItem key={v.id}>
                        <SidebarMenuButton isActive={v.id === view} tooltip={`${v.label} (${i + 1})`} onClick={() => onView(v.id)} className="h-10 font-semibold">
                          <v.icon aria-hidden />
                          <span>{v.label}</span>
                        </SidebarMenuButton>
                        {b && b.n > 0 && <SidebarMenuBadge className={cn('num font-bold', b.hot && 'bg-primary text-primary-foreground')}>{b.n}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Ver carta" render={<Link to="/" />}>
                  <Store aria-hidden /><span>Ver carta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Cerrar sesión" onClick={onLogout}>
                  <Avatar className="size-6"><AvatarFallback className="bg-sidebar-accent text-xs font-bold uppercase text-sidebar-foreground">{user.slice(0, 1) || '?'}</AvatarFallback></Avatar>
                  <span className="flex-1 truncate font-semibold">{user || '…'}</span>
                  <LogOut aria-hidden />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur lg:h-16 lg:px-6">
            <SidebarTrigger aria-label="Mostrar u ocultar el menú" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <h1 className="font-heading text-xl font-semibold lg:text-2xl">{current.label}</h1>
            <Badge variant="outline" role="status" className="ml-1 gap-1.5 font-bold text-muted-foreground">
              <span className={cn('size-2 rounded-full', live ? 'bg-leaf' : 'bg-destructive')} aria-hidden />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{live ? 'En vivo' : 'Sin conexión'}</span>
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="outline" onClick={onPalette} className="hidden w-56 justify-start gap-2 text-muted-foreground md:flex">
                <Search data-icon="inline-start" /><span className="flex-1 text-left font-medium">Buscar o ir a…</span><Kbd>Ctrl K</Kbd>
              </Button>
              <IconTip label="Buscar o ir a"><Button variant="ghost" size="icon" onClick={onPalette} aria-label="Buscar o ir a" className="md:hidden"><Search /></Button></IconTip>
              <IconTip label={sound ? 'Silenciar avisos' : 'Activar sonido de avisos'}><Button variant="ghost" size="icon" onClick={onSound} aria-label={sound ? 'Silenciar avisos' : 'Activar sonido de avisos'} aria-pressed={sound}>{sound ? <Volume2 /> : <VolumeX />}</Button></IconTip>
              <IconTip label={isDark ? 'Tema claro' : 'Tema oscuro'}><Button variant="ghost" size="icon" onClick={toggle} aria-label={isDark ? 'Tema claro' : 'Tema oscuro'}>{isDark ? <Sun /> : <Moon />}</Button></IconTip>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[88rem] px-4 py-5 lg:px-6 lg:py-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
