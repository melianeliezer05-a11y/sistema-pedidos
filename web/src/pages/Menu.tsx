import { ReceiptText, ShoppingBag } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartSheet, Ticket } from '@/components/CartSheet'
import { ProductCard } from '@/components/ProductCard'
import { ProductDialog } from '@/components/ProductDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useCart } from '@/lib/cart'
import { errorMessage, formatMoney } from '@/lib/format'
import { useSettings } from '@/lib/settings'
import type { Product } from '@/lib/types'
import { LAST_ORDER_KEY } from '@/pages/Tracking'

function lastOrder() { try { return localStorage.getItem(LAST_ORDER_KEY) } catch { return null } }

const today = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export default function Menu() {
  const { settings } = useSettings()
  const cart = useCart()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const last = lastOrder()

  const load = useCallback(async () => {
    try { setProducts(await api.products()); setError('') } catch (e) { setError(errorMessage(e)) }
  }, [])
  useEffect(() => { void load() }, [load])

  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <header className="border-b border-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-mono text-sm font-semibold tracking-tight uppercase">{settings.restaurantName}</Link>
          {last && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`/pedido/${last}`} />}>
              <ReceiptText data-icon="inline-start" /> Mi pedido
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-x-12 px-4 lg:grid-cols-[1fr_22rem]">
        <main>
          <section className="pt-10 pb-6 sm:pt-16">
            <p className="label">{today}</p>
            <h1 className="mt-3 text-[clamp(3.5rem,13vw,8rem)] leading-[0.85] font-semibold tracking-tighter">Carta</h1>
            <p className="mt-5 max-w-sm text-muted-foreground">Elige, personaliza y va directo a la plancha. Sin registro.</p>
          </section>

          {error && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive p-4 text-destructive">
              <p className="font-medium">No se pudo cargar la carta. {error}</p>
              <Button variant="outline" onClick={() => void load()}>Reintentar</Button>
            </div>
          )}

          <ul aria-label="Carta" className="border-t-2 border-foreground">
            {products === null && !error && Array.from({ length: 5 }, (_, i) => <li key={i} className="py-5"><Skeleton className="h-14 w-full" /></li>)}
            {products?.map((p, i) => <ProductCard key={p.id} product={p} index={i} alertUnits={settings.clientAlertUnits} onPick={setPicked} />)}
          </ul>
          {products?.length === 0 && <p className="py-10 text-center text-muted-foreground">La carta está vacía ahora mismo.</p>}

          <footer className="py-12 text-sm text-muted-foreground">
            <Link to="/admin" className="underline-offset-4 hover:underline">Acceso del personal</Link>
          </footer>
        </main>

        <aside className="hidden lg:block" aria-label="Tu pedido">
          <div className="sticky top-6 mt-16 border border-foreground shadow-[6px_6px_0_0_var(--foreground)]">
            <Ticket onOrdered={() => void load()} />
          </div>
        </aside>
      </div>

      {cart.count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <Button size="lg" className="mx-auto flex h-14 w-full max-w-md justify-between" onClick={() => setCartOpen(true)}>
            <span className="flex items-center gap-2"><ShoppingBag data-icon="inline-start" /> Ver pedido · <span className="num">{cart.count}</span></span>
            <span className="num">{formatMoney(cart.total)}</span>
          </Button>
        </div>
      )}

      <ProductDialog product={picked} onClose={() => setPicked(null)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onOrdered={() => void load()} />
    </div>
  )
}
