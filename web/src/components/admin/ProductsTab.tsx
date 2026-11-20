import { Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { errorMessage, formatMoney, tileFor } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props { products: Product[] | null; alertUnits: number; onChanged: () => Promise<void> }

export function ProductsTab({ products, alertUnits, onChanged }: Props) {
  const [editing, setEditing] = useState<Product | null>(null)
  if (!products) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>

  const toggle = async (p: Product, active: boolean) => {
    try { await api.admin.updateProduct(p.id, { active }); toast.success(active ? `${p.name} vuelve a la carta` : `${p.name} oculto de la carta`); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const units = p.availableUnits
          const tone = units <= 0 ? 'bg-destructive/10 text-destructive' : units <= alertUnits ? 'bg-secondary text-secondary-foreground' : 'bg-leaf/15 text-leaf'
          return (
            <li key={p.id} className={cn('grid gap-3 rounded-2xl border border-border bg-card p-4', !p.active && 'opacity-70')}>
              <div className="flex items-center gap-3">
                <span className="sticker grid size-14 shrink-0 place-items-center rounded-xl text-3xl" style={{ backgroundColor: tileFor(p.id) }} aria-hidden>{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg font-bold">{p.name}</p>
                  <p className="num font-extrabold text-primary">{formatMoney(p.price)}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Editar ${p.name}`} onClick={() => setEditing(p)}><Pencil aria-hidden /></Button>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              {p.recipeDetail && <p className="text-xs text-muted-foreground">Lleva: {p.recipeDetail.map((r) => `${r.qty} ${r.name.toLowerCase()}`).join(' · ')}</p>}
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
                <span className={cn('num rounded-full px-2.5 py-1 text-sm font-bold', tone)}>{units <= 0 ? 'Sin stock' : `${units} posibles`}</span>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={p.active} onCheckedChange={(c) => toggle(p, c)} aria-label={`${p.name} en carta`} />
                  En carta
                </label>
              </div>
            </li>
          )
        })}
      </ul>
      <EditDialog key={editing?.id ?? 'none'} product={editing} onClose={() => setEditing(null)} onSaved={onChanged} />
    </>
  )
}

function EditDialog({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [description, setDescription] = useState(product?.description ?? '')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!product) return
    setBusy(true)
    try {
      await api.admin.updateProduct(product.id, { name, price: Number(price), description })
      toast.success('Plato actualizado')
      await onSaved()
      onClose()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader><DialogTitle className="text-xl font-bold">Editar plato</DialogTitle><DialogDescription>Los cambios se ven al momento en la carta.</DialogDescription></DialogHeader>
          <div className="grid gap-1.5"><Label htmlFor="p-name">Nombre</Label><Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="h-11" /></div>
          <div className="grid gap-1.5"><Label htmlFor="p-price">Precio</Label><Input id="p-price" type="number" inputMode="decimal" step="0.05" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="num h-11" /></div>
          <div className="grid gap-1.5"><Label htmlFor="p-desc">Descripción</Label><Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>Guardar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
