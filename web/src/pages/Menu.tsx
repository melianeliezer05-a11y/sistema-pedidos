import { ReceiptText, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartSheet } from '@/components/CartSheet'
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
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-lg" aria-hidden>🍔</span>
            {settings.restaurantName}
          </Link>
          <div className="flex items-center gap-1">
            {last && (
              <Button variant="ghost" nativeButton={false} render={<Link to={`/pedido/${last}`} />}>
                <ReceiptText aria-hidden /> <span className="hidden sm:inline">Mi pedido</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => setCartOpen(true)} aria-label={`Ver pedido, ${cart.count} artículos`}>
              <ShoppingBag aria-hidden />
              <span className="hidden sm:inline">Pedido</span>
              <motion.span key={cart.count} initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="num grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-extrabold text-primary-foreground">
                {cart.count}
              </motion.span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-8 sm:py-12">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wide text-primary uppercase"><UtensilsCrossed className="size-4" aria-hidden /> Carta de hoy</p>
          <h1 className="text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.02] font-extrabold">¿Qué te pongo?</h1>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">Elige, personalízalo a tu gusto y lo mandamos directo a la plancha. Sin registrarte.</p>
        </section>

        {error && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 p-4 text-destructive">
            <p className="font-semibold">No hemos podido cargar la carta. {error}</p>
            <Button variant="outline" onClick={() => void load()}>Reintentar</Button>
          </div>
        )}

        <section aria-label="Carta" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products === null && !error && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
          {products?.map((p, i) => <ProductCard key={p.id} product={p} index={i} alertUnits={settings.clientAlertUnits} onPick={setPicked} />)}
          {products?.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">La carta está vacía ahora mismo. Vuelve en un rato.</p>}
        </section>
      </main>

      <footer className="mx-auto mt-16 max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <Link to="/admin" className="underline-offset-4 hover:underline">Acceso del personal</Link>
      </footer>

      {cart.count > 0 && !cartOpen && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button size="lg" className="mx-auto flex h-14 w-full max-w-md justify-between shadow-lg" onClick={() => setCartOpen(true)}>
            <span className="flex items-center gap-2"><ShoppingBag aria-hidden /> Ver pedido · <span className="num">{cart.count}</span></span>
            <span className="num font-extrabold">{formatMoney(cart.total)}</span>
          </Button>
        </motion.div>
      )}

      <ProductDialog product={picked} onClose={() => setPicked(null)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} onOrdered={() => void load()} />
    </div>
  )
}
