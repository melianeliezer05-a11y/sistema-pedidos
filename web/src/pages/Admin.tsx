import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { InventoryTab } from '@/components/admin/InventoryTab'
import { MovementsTab } from '@/components/admin/MovementsTab'
import { OrdersTab } from '@/components/admin/OrdersTab'
import { OverviewTab } from '@/components/admin/OverviewTab'
import { ProductsTab } from '@/components/admin/ProductsTab'
import { SettingsTab } from '@/components/admin/SettingsTab'
import { Shell, VIEWS, type View } from '@/components/admin/Shell'
import { api, auth } from '@/lib/api'
import { errorMessage } from '@/lib/format'
import { useSettings } from '@/lib/settings'
import { chime, setSoundEnabled, soundEnabled } from '@/lib/sound'
import type { Ingredient, Movement, Order, Product } from '@/lib/types'

const POLL_MS = 8000

export default function Admin() {
  const nav = useNavigate()
  const { settings } = useSettings()
  const [user, setUser] = useState('')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [movements, setMovements] = useState<Movement[] | null>(null)
  const [view, setView] = useState<View>('overview')
  const [live, setLive] = useState(true)
  const [sound, setSound] = useState(soundEnabled)
  const [palette, setPalette] = useState(false)
  const [query, setQuery] = useState('')
  const seen = useRef<Set<string> | null>(null)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  const logout = useCallback(() => { auth.clear(); nav('/admin/login', { replace: true }) }, [nav])
  useEffect(() => { window.addEventListener('pedidos:logout', logout); return () => window.removeEventListener('pedidos:logout', logout) }, [logout])

  const loadOrders = useCallback(async () => {
    try {
      const list = await api.admin.orders()
      setLive(true)
      if (seen.current) {
        const added = list.filter((o) => !seen.current!.has(o.id))
        if (added.length) {
          toast.info(added.length === 1 ? `Pedido nuevo de ${added[0].customerName}` : `${added.length} pedidos nuevos`)
          if (soundRef.current) chime()
          setFresh(new Set(added.map((o) => o.id)))
          setTimeout(() => setFresh(new Set()), 4000)
        }
      }
      seen.current = new Set(list.map((o) => o.id))
      setOrders(list)
    } catch { setLive(false) }
  }, [])

  const loadStock = useCallback(async () => {
    try {
      const [i, p, m] = await Promise.all([api.admin.ingredients(), api.admin.products(), api.admin.movements()])
      setIngredients(i); setProducts(p); setMovements(m)
    } catch (e) { if (live) toast.error(errorMessage(e)) }
  }, [live])

  const refreshAll = useCallback(async () => { await Promise.all([loadOrders(), loadStock()]) }, [loadOrders, loadStock])

  useEffect(() => {
    if (!auth.get()) return
    api.me().then((r) => setUser(r.user.username)).catch(() => {})
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!auth.get()) return
    const t = setInterval(() => { if (!document.hidden) { void loadOrders(); void loadStock() } }, POLL_MS)
    return () => clearInterval(t)
  }, [loadOrders, loadStock])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); return }
      const el = e.target as HTMLElement
      if (palette || e.ctrlKey || e.metaKey || e.altKey || el.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return
      const n = Number(e.key)
      if (n >= 1 && n <= VIEWS.length) setView(VIEWS[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [palette])

  const toggleSound = useCallback(() => {
    const next = !soundRef.current
    setSound(next); setSoundEnabled(next)
    if (next) chime()
    toast(next ? 'Sonido activado' : 'Sonido silenciado')
  }, [])

  const openOrder = useCallback((id: string) => { setQuery(id); setView('orders') }, [])

  const badges = useMemo(() => {
    const open = orders?.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length ?? 0
    const pending = orders?.some((o) => o.status === 'pending') ?? false
    const low = ingredients?.filter((i) => i.stock <= i.min_stock).length ?? 0
    return { orders: { n: open, hot: pending }, inventory: { n: low } }
  }, [orders, ingredients])

  if (!auth.get()) return <Navigate to="/admin/login" replace />

  return (
    <Shell view={view} onView={setView} badges={badges} user={user} name={settings.restaurantName} live={live} sound={sound} onSound={toggleSound} onPalette={() => setPalette(true)} onLogout={logout}>
      {view === 'overview' && <OverviewTab orders={orders} ingredients={ingredients} onView={setView} />}
      {view === 'orders' && <OrdersTab orders={orders} fresh={fresh} query={query} onQuery={setQuery} onChanged={refreshAll} />}
      {view === 'inventory' && <InventoryTab ingredients={ingredients} onChanged={loadStock} />}
      {view === 'products' && <ProductsTab products={products} alertUnits={settings.clientAlertUnits} onChanged={loadStock} />}
      {view === 'movements' && <MovementsTab movements={movements} />}
      {view === 'settings' && <SettingsTab />}
      <CommandPalette open={palette} onOpenChange={setPalette} orders={orders} onView={setView} onOrder={openOrder} onSound={toggleSound} onLogout={logout} />
    </Shell>
  )
}
