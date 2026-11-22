import { Plus, Pencil, Trash2, ChefHat, Minus, X } from 'lucide-react'
import { useState, type FormEvent, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import { errorMessage, formatMoney, tileFor } from '@/lib/format'
import type { Product, Ingredient } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props { products: Product[] | null; alertUnits: number; onChanged: () => Promise<void> }

export function ProductsTab({ products, alertUnits, onChanged }: Props) {
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  if (!products) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>

  const toggle = async (p: Product, active: boolean) => {
    try { await api.admin.updateProduct(p.id, { active }); toast.success(active ? `${p.name} vuelve a la carta` : `${p.name} oculto de la carta`); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Eliminar "${p.name}"? Se desactivará (soft delete).`)) return
    try { await api.admin.deleteProduct(p.id); toast.success(`${p.name} desactivado`); await onChanged() } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold">Gestión de carta</h2>
        <Button onClick={() => { setEditing(null); setCreating(true) }}><Plus className="mr-2 h-4 w-4" /> Nuevo plato</Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const units = p.availableUnits
          const tone = units <= 0 ? 'destructive' : units <= alertUnits ? 'secondary' : 'outline'
          return (
            <li key={p.id}>
             <Card size="sm" className={cn(!p.active && 'opacity-70')}>
              <CardHeader className="flex items-center gap-3">
                <span className="border border-border grid size-14 shrink-0 place-items-center rounded-md text-3xl" style={{ backgroundColor: tileFor(p.id) }} aria-hidden>{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg font-bold">{p.name}</p>
                  <p className="num font-semibold text-primary">{formatMoney(p.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={`Editar ${p.name}`} onClick={() => { setCreating(false); setEditing(p) }} />}><Pencil /></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={`Eliminar ${p.name}`} onClick={() => handleDelete(p)} className="text-destructive hover:text-destructive" />}><Trash2 /></TooltipTrigger><TooltipContent>Desactivar</TooltipContent></Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                {p.recipeDetail && <p className="text-xs text-muted-foreground">Receta: {p.recipeDetail.map((r) => `${r.qty} ${r.name.toLowerCase()}`).join(' · ')}</p>}
              </CardContent>
              <CardFooter className="justify-between pb-3">
                <Badge variant={tone} className="num h-7 px-2.5 text-sm">{units <= 0 ? 'Sin stock' : `${units} posibles`}</Badge>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={p.active} onCheckedChange={(c) => toggle(p, c)} aria-label={`${p.name} en carta`} />
                  En carta
                </label>
              </CardFooter>
             </Card>
            </li>
          )
        })}
      </ul>

      <ProductFormDialog
        product={editing}
        isCreating={creating}
        onClose={() => { setEditing(null); setCreating(false) }}
        onSaved={onChanged}
      />
    </div>
  )
}

interface ProductFormDialogProps {
  product: Product | null
  isCreating: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}

function ProductFormDialog({ product, isCreating, onClose, onSaved }: ProductFormDialogProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [recipe, setRecipe] = useState<Record<string, number>>({})
  const [removableIds, setRemovableIds] = useState<string[]>([])
  const [extras, setExtras] = useState<Array<{ id: string; name: string; price: number; ingredient: string; qty: number }>>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState<'basics' | 'recipe' | 'extras'>('basics')

  useEffect(() => {
    if (product) {
      setName(product.name)
      setEmoji(product.emoji)
      setPrice(String(product.price))
      setDescription(product.description)
      setRecipe(product.recipe || {})
      setRemovableIds(product.removableIds || product.removable?.map(r => r.id) || [])
      setExtras(product.extrasDef || product.extras?.map(e => ({ id: e.id, name: e.name, price: e.price, ingredient: e.ingredient, qty: e.qty })) || [])
    } else {
      setName(''); setEmoji('🍽️'); setPrice(''); setDescription(''); setRecipe({}); setRemovableIds([]); setExtras([])
    }
    api.admin.ingredients().then(setIngredients).catch(() => toast.error('No se pudieron cargar ingredientes'))
    setActiveTab('basics')
  }, [product, isCreating])

  const toggleRemovable = (ingId: string) => {
    setRemovableIds(prev => prev.includes(ingId) ? prev.filter(id => id !== ingId) : [...prev, ingId])
  }

  const addRecipeIngredient = (ingId: string) => {
    setRecipe(prev => ({ ...prev, [ingId]: (prev[ingId] || 0) + 1 }))
  }
  const removeRecipeIngredient = (ingId: string) => {
    setRecipe(prev => { const next = { ...prev }; if (next[ingId] <= 1) delete next[ingId]; else next[ingId]--; return next })
  }
  const setRecipeQty = (ingId: string, qty: number) => {
    if (qty <= 0) removeRecipeIngredient(ingId)
    else setRecipe(prev => ({ ...prev, [ingId]: qty }))
  }

  const addExtra = () => {
    const newId = `extra-${Date.now()}`
    setExtras(prev => [...prev, { id: newId, name: '', price: 0, ingredient: ingredients[0]?.id || '', qty: 1 }])
  }
  const updateExtra = (index: number, field: string, value: any) => {
    setExtras(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }
  const removeExtra = (index: number) => {
    setExtras(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    if (!name.trim()) return 'El nombre es obligatorio'
    if (!emoji.trim()) return 'El emoji es obligatorio'
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return 'Precio no válido'
    if (Object.keys(recipe).length === 0) return 'La receta debe tener al menos un ingrediente'
    for (const ex of extras) {
      if (!ex.name.trim() || !ex.ingredient || !Number.isFinite(ex.price) || ex.price < 0 || !Number.isFinite(ex.qty) || ex.qty <= 0) {
        return 'Todos los extras deben tener nombre, ingrediente, precio y cantidad válidos'
      }
    }
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) return toast.error(err)
    setBusy(true)
    try {
      if (isCreating) {
        await api.admin.createProduct({
          name: name.trim(),
          emoji: emoji.trim(),
          price: Number(price),
          description: description.trim(),
          recipe,
          removable: removableIds,
          extras,
        })
        toast.success('Plato creado')
      } else if (product) {
        await api.admin.updateProduct(product.id, { name: name.trim(), price: Number(price), description: description.trim() })
        toast.success('Plato actualizado (básico)')
      }
      await onSaved()
      onClose()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  const tabs = [
    { id: 'basics', label: 'Básico', icon: null },
    { id: 'recipe', label: 'Receta', icon: ChefHat },
    { id: 'extras', label: 'Extras', icon: Plus },
  ] as const

  return (
    <Dialog open={!!product || isCreating} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{isCreating ? 'Nuevo plato' : 'Editar plato'}</DialogTitle>
            <DialogDescription>Los cambios se ven al momento en la carta.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b pb-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-t transition-colors flex items-center gap-1',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {tab.label}
                {tab.icon && <tab.icon className="inline h-3 w-3 ml-1" />}
              </button>
            ))}
          </div>

          {activeTab === 'basics' && (
            <FieldGroup className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="p-name">Nombre</FieldLabel>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Ej: Tostada con tomate" />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-emoji">Emoji</FieldLabel>
                <Input id="p-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} required maxLength={4} placeholder="🍽️" />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-price">Precio (€)</FieldLabel>
                <Input id="p-price" type="number" inputMode="decimal" step="0.05" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="num" placeholder="8.50" />
              </Field>
              <Field className="col-span-full">
                <FieldLabel htmlFor="p-desc">Descripción</FieldLabel>
                <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} placeholder="Descripción breve para el cliente..." />
              </Field>
            </FieldGroup>
          )}

          {activeTab === 'recipe' && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">Selecciona ingredientes y cantidades. Los marcados como "Removible" podrán quitarse el cliente.</p>
              <ScrollArea className="h-80">
                <div className="grid gap-3">
                  {ingredients.map((ing) => {
                    const qty = recipe[ing.id] || 0
                    const isRemovable = removableIds.includes(ing.id)
                    return (
                      <div key={ing.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
                        <span className="text-2xl">{ing.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{ing.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {ing.stock} {ing.unit} · Mín: {ing.min_stock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => addRecipeIngredient(ing.id)} disabled={qty > 0}><Plus className="h-4 w-4" /></Button>
                          {qty > 0 && (
                            <div>
                              <Button variant="outline" size="icon" onClick={() => removeRecipeIngredient(ing.id)}><Minus className="h-4 w-4" /></Button>
                              <Input type="number" min="1" max="20" value={qty} onChange={(e) => setRecipeQty(ing.id, Number(e.target.value))} className="num w-20 text-center" />
                              <Button variant="outline" size="icon" onClick={() => addRecipeIngredient(ing.id)}><Plus className="h-4 w-4" /></Button>
                              <Label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input type="checkbox" checked={isRemovable} onChange={() => toggleRemovable(ing.id)} className="h-4 w-4" />
                                <span>Removible</span>
                              </Label>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
              {Object.keys(recipe).length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  <ChefHat className="mx-auto mb-2 h-8 w-8" />
                  <p>Añade ingredientes a la receta</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">Extras que el cliente puede añadir (con cargo extra). Cada extra consume ingredientes.</p>
              <div className="space-y-3">
                {extras.map((ex, i) => (
                  <div key={ex.id} className="flex flex-col sm:flex-row gap-3 p-3 border border-border rounded-lg bg-card">
                    <div className="flex-1">
                      <Label htmlFor={`ex-name-${i}`}>Nombre del extra</Label>
                      <Input id={`ex-name-${i}`} value={ex.name} onChange={(e) => updateExtra(i, 'name', e.target.value)} placeholder="Ej: Queso extra" />
                    </div>
                    <div className="w-full sm:w-48">
                      <Label htmlFor={`ex-price-${i}`}>Precio extra (€)</Label>
                      <Input id={`ex-price-${i}`} type="number" step="0.05" min="0" value={ex.price} onChange={(e) => updateExtra(i, 'price', Number(e.target.value))} className="num" placeholder="0.75" />
                    </div>
                    <div className="w-full sm:w-48">
                      <Label htmlFor={`ex-ingredient-${i}`}>Ingrediente que consume</Label>
                      <select id={`ex-ingredient-${i}`} value={ex.ingredient} onChange={(e) => updateExtra(i, 'ingredient', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.emoji})</option>)}
                      </select>
                    </div>
                    <div className="w-full sm:w-32">
                      <Label htmlFor={`ex-qty-${i}`}>Cantidad</Label>
                      <Input id={`ex-qty-${i}`} type="number" min="1" max="10" value={ex.qty} onChange={(e) => updateExtra(i, 'qty', Number(e.target.value))} className="num" placeholder="1" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExtra(i)} className="self-end text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addExtra} className="w-fit"><Plus className="mr-2 h-4 w-4" /> Añadir extra</Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Guardando...' : (isCreating ? 'Crear plato' : 'Guardar cambios')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

