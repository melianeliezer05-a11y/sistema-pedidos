import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/lib/cart'
import { formatMoney, tileFor } from '@/lib/format'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

interface Props { product: Product | null; onClose: () => void }

/** El contenido se monta por producto (key) para que el estado arranque limpio cada vez. */
export function ProductDialog({ product, onClose }: Props) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {product && <Body key={product.id} product={product} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function Body({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const cart = useCart()
  const [kept, setKept] = useState<Record<string, boolean>>(() => Object.fromEntries(p.removable.map((r) => [r.id, true])))
  const [extras, setExtras] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState('')
  const [qty, setQty] = useState(1)

  const chosen = p.extras.filter((e) => extras[e.id])
  const unit = p.price + chosen.reduce((s, e) => s + e.price, 0)
  const maxQty = Math.max(1, Math.min(20, p.availableUnits))

  const add = () => {
    const removed = p.removable.filter((r) => !kept[r.id])
    cart.add({
      productId: p.id, name: p.name, emoji: p.emoji, unitPrice: unit, quantity: qty,
      removed: removed.map((r) => r.id), removedNames: removed.map((r) => r.name),
      extras: chosen.map((e) => e.id), extraNames: chosen.map((e) => e.name),
      comments: comments.trim(),
    })
    toast.success(`${qty}× ${p.name} en tu pedido`)
    onClose()
  }

  return (
    <>
      <div className="border border-border mx-4 mt-4 mb-1 grid h-28 place-items-center rounded-md text-6xl select-none" style={{ backgroundColor: tileFor(p.id) }} aria-hidden>{p.emoji}</div>
      <DialogHeader className="px-5 pt-3">
        <DialogTitle className="text-2xl font-bold">{p.name}</DialogTitle>
        <DialogDescription className="text-sm">{p.description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 px-5 py-4">
        {p.removable.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 font-heading text-sm font-bold">Ingredientes <span className="font-sans font-normal text-muted-foreground">· desmarca lo que no quieras</span></legend>
            {p.removable.map((r) => (
              <label key={r.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 has-data-checked:border-foreground/40 has-data-checked:bg-muted">
                <Checkbox checked={kept[r.id]} onCheckedChange={(c) => setKept((k) => ({ ...k, [r.id]: !!c }))} />
                <span className={kept[r.id] ? '' : 'text-muted-foreground line-through'}>{r.name}</span>
              </label>
            ))}
          </fieldset>
        )}

        {p.extras.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 font-heading text-sm font-bold">Extras</legend>
            {p.extras.map((e) => (
              <label key={e.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 has-data-checked:border-primary has-data-checked:bg-primary/5">
                <Checkbox checked={!!extras[e.id]} onCheckedChange={(c) => setExtras((x) => ({ ...x, [e.id]: !!c }))} />
                <span className="flex-1">{e.name}</span>
                <span className="num text-sm font-bold text-primary">+{formatMoney(e.price)}</span>
              </label>
            ))}
          </fieldset>
        )}

        <label className="grid gap-1.5">
          <span className="font-heading text-sm font-bold">Nota para cocina <span className="font-sans font-normal text-muted-foreground">· opcional</span></span>
          <Textarea value={comments} onChange={(e) => setComments(e.target.value)} maxLength={200} rows={2} placeholder="Ej: bien hecha, sin sal…" />
        </label>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-popover px-5 py-4">
        <div className="flex items-center gap-1 rounded-md border border-border" role="group" aria-label="Cantidad">
          <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Menos"><Minus aria-hidden /></Button>
          <span className="num w-6 text-center font-semibold" aria-live="polite">{qty}</span>
          <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Más"><Plus aria-hidden /></Button>
        </div>
        <Button size="lg" className="flex-1" onClick={add}>
          Añadir · <span className="num">{formatMoney(unit * qty)}</span>
        </Button>
      </div>
    </>
  )
}
