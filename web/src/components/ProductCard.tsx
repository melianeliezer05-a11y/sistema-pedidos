import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props { product: Product; alertUnits: number; index: number; onPick: (p: Product) => void }

/** Línea de carta tipo comanda: nombre ··· precio, descripción debajo y botón cuadrado. */
export function ProductCard({ product: p, alertUnits, index, onPick }: Props) {
  const out = p.availableUnits <= 0
  const low = !out && p.availableUnits <= alertUnits
  const label = out ? `${p.name}, agotado` : `Añadir ${p.name}`

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.24) }}
      className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-x-4 border-b border-dashed border-border py-5 last:border-b-0"
    >
      <span className={cn('grid size-14 place-items-center rounded-md border border-border bg-card text-3xl leading-none select-none', out && 'opacity-40 grayscale')} aria-hidden>{p.emoji}</span>
      <div className={cn('min-w-0', out && 'text-muted-foreground')}>
        <div className="flex items-end gap-2">
          <h3 className="text-lg leading-tight font-semibold">{p.name}</h3>
          <span className="leader" aria-hidden />
          <span className="num text-base font-medium">{formatMoney(p.price)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
        {(out || low) && (
          <p className={cn('label mt-2', low && 'text-signal')}>{out ? 'Agotado por hoy' : p.availableUnits === 1 ? 'Queda 1 solo' : `Quedan ${p.availableUnits}`}</p>
        )}
      </div>
      <Button size="icon-lg" variant={out ? 'outline' : 'default'} disabled={out} onClick={() => onPick(p)} aria-label={label}><Plus /></Button>
    </motion.li>
  )
}
