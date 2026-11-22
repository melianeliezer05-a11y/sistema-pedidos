import { AlertTriangle, CheckCircle2, Search, XOctagon, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/format'
import type { Ingredient } from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS = [-10, -1, 1, 10]

function level(i: Ingredient) { return i.stock <= 0 ? 'out' : i.stock <= i.min_stock ? 'low' : 'ok' }

const PILL = {
  ok: { cls: 'outline' as const, Icon: CheckCircle2, text: 'Bien' },
  low: { cls: 'secondary' as const, Icon: AlertTriangle, text: 'Poco' },
  out: { cls: 'destructive' as const, Icon: XOctagon, text: 'Agotado' },
}

export function InventoryTab({ ingredients, onChanged }: { ingredients: Ingredient[] | null; onChanged: () => Promise<void> }) {
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  if (!ingredients) return <Skeleton className="h-80 rounded-2xl" />

  const rows = ingredients.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()))

  const adjust = async (i: Ingredient, delta: number) => {
    try { await api.admin.adjustStock(i.id, delta); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }
  const threshold = async (i: Ingredient, raw: string) => {
    const v = Number(raw)
    if (raw === '' || !Number.isFinite(v) || v < 0 || v === i.min_stock) return
    try { await api.admin.setThreshold(i.id, v); toast.success(`Aviso de ${i.name.toLowerCase()} en ${v}`); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }
  const handleDelete = async (i: Ingredient) => {
    if (!confirm(`Eliminar "${i.name}"? No se puede si se usa en recetas.`)) return
    try { await api.admin.deleteIngredient(i.id); toast.success(`${i.name} eliminado`); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-xl font-bold">Inventario</h2>
          <Badge variant="secondary" className="text-xs">{ingredients.length} ingredientes</Badge>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo ingrediente</Button>
      </div>

      <InputGroup className="max-w-xs mb-3">
        <InputGroupAddon><Search /></InputGroupAddon>
        <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ingrediente" aria-label="Buscar ingrediente" />
      </InputGroup>

      <Card className="overflow-x-auto py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Ajustar</TableHead>
              <TableHead className="w-28">Avisar en</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => {
              const l = level(i)
              const { cls, Icon, text } = PILL[l]
              return (
                <TableRow key={i.id} className={cn(l !== 'ok' && 'bg-secondary/20')}>
                  <TableCell className="font-semibold whitespace-nowrap">{i.emoji} {i.name}</TableCell>
                  <TableCell>
                    <Badge variant={cls} className="num h-7 gap-1.5 px-2.5 text-sm">
                      <Icon data-icon="inline-start" /> {i.stock} {i.unit} <span className="sr-only">({text})</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ToggleGroup value={[]} variant="outline" size="sm" aria-label={`Ajustar ${i.name}`}>
                      {STEPS.map((s) => (
                        <ToggleGroupItem key={s} value={String(s)} className="num min-w-11" onClick={() => adjust(i, s)} disabled={s < 0 && i.stock <= 0}>{s > 0 ? `+${s}` : s}</ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </TableCell>
                  <TableCell>
                    <Input type="number" inputMode="decimal" min={0} defaultValue={i.min_stock} key={`${i.id}-${i.min_stock}`} aria-label={`Aviso de ${i.name}`}
                      onBlur={(e) => threshold(i, e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} className="num h-9 w-20" />
                  </TableCell>
                  <TableCell>
                    <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={`Eliminar ${i.name}`} onClick={() => handleDelete(i)} className="text-destructive hover:text-destructive" disabled={false} />}><Trash2 /></TooltipTrigger><TooltipContent>Eliminar (solo si no se usa en recetas)</TooltipContent></Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={5}><Empty><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>Ningún ingrediente coincide</EmptyTitle></EmptyHeader></Empty></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <IngredientFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={onChanged}
      />
    </>
  )
}

function IngredientFormDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [unit, setUnit] = useState('u')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    if (!emoji.trim()) return toast.error('El emoji es obligatorio')
    setBusy(true)
    try {
      await api.admin.createIngredient({ name: name.trim(), emoji: emoji.trim(), stock, minStock, unit })
      toast.success('Ingrediente creado')
      await onSaved()
      onOpenChange(false)
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  const reset = () => { setName(''); setEmoji('📦'); setStock(0); setMinStock(5); setUnit('u') }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo ingrediente</DialogTitle>
            <DialogDescription>Se usará para recetas y control de stock.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ing-name">Nombre</Label>
              <Input id="ing-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Ej: Aguacate" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-emoji">Emoji</Label>
              <Input id="ing-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} required maxLength={4} placeholder="🥑" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-stock">Stock inicial</Label>
              <Input id="ing-stock" type="number" min="0" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="num" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-min">Avisar si baja de</Label>
              <Input id="ing-min" type="number" min="0" value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} className="num" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ing-unit">Unidad</Label>
              <Input id="ing-unit" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={10} placeholder="u / porción / kg / L" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Creando...' : 'Crear ingrediente'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}