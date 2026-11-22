import { Minus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useCart } from '@/lib/cart'
import { errorMessage, formatMoney } from '@/lib/format'
import { LAST_ORDER_KEY } from '@/pages/Tracking'

interface TicketProps { onOrdered: () => void; onDone?: () => void }

/** Ticket de comanda: el pedido en curso. Se usa fijo en escritorio y dentro de un Sheet en móvil. */
export function Ticket({ onOrdered, onDone }: TicketProps) {
  const cart = useCart()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const order = await api.createOrder(
        cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, removed: l.removed, extras: l.extras, comments: l.comments })),
        name.trim(),
      )
      try { localStorage.setItem(LAST_ORDER_KEY, order.id) } catch { /* sin almacenamiento: la URL del pedido sigue funcionando */ }
      cart.clear()
      onDone?.()
      onOrdered()
      toast.success('Pedido enviado a cocina')
      nav(`/pedido/${order.id}`)
    } catch (e) {
      setError(errorMessage(e))
      onOrdered()
    } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col bg-card">
      <div className="flex items-baseline justify-between px-5 pt-5">
        <p className="label">Tu pedido</p>
        <p className="label num">{cart.count} {cart.count === 1 ? 'uds' : 'uds'}</p>
      </div>

      {cart.lines.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Vacío. Toca <span className="kbd">+</span> en un plato.</p>
      ) : (
        <ul className="px-5 py-2">
          {cart.lines.map((l) => (
            <li key={l.lineId} className="grid gap-2 border-b border-dashed border-border py-3 last:border-b-0">
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 font-medium">{l.emoji} {l.name}</p>
                <p className="num text-sm">{formatMoney(l.unitPrice * l.quantity)}</p>
              </div>
              {(l.removedNames.length > 0 || l.extraNames.length > 0 || l.comments) && (
                <p className="text-xs text-muted-foreground">
                  {l.removedNames.length > 0 && <>sin {l.removedNames.join(', ')}. </>}
                  {l.extraNames.length > 0 && <>+ {l.extraNames.join(', ')}. </>}
                  {l.comments && <>“{l.comments}”</>}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-md border border-border" role="group" aria-label={`Cantidad de ${l.name}`}>
                  <Button variant="ghost" size="icon-sm" onClick={() => cart.setQty(l.lineId, -1)} disabled={l.quantity <= 1} aria-label="Menos"><Minus /></Button>
                  <span className="num w-6 text-center text-sm">{l.quantity}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => cart.setQty(l.lineId, 1)} aria-label="Más"><Plus /></Button>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => cart.remove(l.lineId)} aria-label={`Quitar ${l.name}`}><X /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 px-5 pb-5">
        <div className="flex items-baseline justify-between border-t-2 border-foreground pt-4">
          <span className="label">Total</span>
          <span className="num text-3xl font-medium">{formatMoney(cart.total)}</span>
        </div>
        <Field>
          <FieldLabel htmlFor="cart-name">Nombre <span className="font-normal text-muted-foreground">· opcional</span></FieldLabel>
          <Input id="cart-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ana" autoComplete="given-name" />
        </Field>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button size="lg" className="h-12 w-full" disabled={busy || cart.lines.length === 0} onClick={submit}>
          {busy ? <><Spinner data-icon="inline-start" /> Enviando…</> : 'Confirmar pedido'}
        </Button>
      </div>
      <div className="tear" aria-hidden />
    </div>
  )
}

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onOrdered: () => void }

export function CartSheet({ open, onOpenChange, onOrdered }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto p-0">
        <SheetHeader className="sr-only"><SheetTitle>Tu pedido</SheetTitle><SheetDescription>Revisa y confirma tu pedido.</SheetDescription></SheetHeader>
        <Ticket onOrdered={onOrdered} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
