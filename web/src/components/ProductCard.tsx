import { Flame, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { formatMoney, tileFor } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props { product: Product; alertUnits: number; index: number; onPick: (p: Product) => void }

export function ProductCard({ product: p, alertUnits, index, onPick }: Props) {
  const out = p.availableUnits <= 0
  const low = !out && p.availableUnits <= alertUnits

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut', delay: Math.min(index * 0.04, 0.24) }}
      className={cn('flex flex-col overflow-hidden rounded-2xl border border-border bg-card', out && 'opacity-70')}
    >
      <div className="p-3 pb-0">
        <div
          className="sticker relative grid aspect-[5/3] place-items-center rounded-xl text-[4.5rem] leading-none select-none"
          style={{ backgroundColor: out ? 'var(--muted)' : tileFor(p.id) }}
          aria-hidden
        >
          <span className={cn(out && 'grayscale')}>{p.emoji}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-tight font-bold">{p.name}</h3>
          <span className="num shrink-0 pt-0.5 text-lg font-extrabold text-primary">{formatMoney(p.price)}</span>
        </div>
        <p className="flex-1 text-sm text-muted-foreground">{p.description}</p>
        {(out || low) && (
          <p
            className={cn(
              'flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
              out ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <Flame className="size-3.5" aria-hidden />
            {out ? 'Agotado por hoy' : p.availableUnits === 1 ? '¡Queda 1 solo!' : `Quedan ${p.availableUnits}`}
          </p>
        )}
        <Button size="lg" className="mt-1 w-full" disabled={out} onClick={() => onPick(p)} aria-label={out ? `${p.name}, agotado` : `Añadir ${p.name}`}>
          <Plus aria-hidden />
          {out ? 'Agotado' : 'Añadir'}
        </Button>
      </div>
    </motion.article>
  )
}
