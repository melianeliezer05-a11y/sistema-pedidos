import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import type { Movement } from '@/lib/types'
import { cn } from '@/lib/utils'

export function MovementsTab({ movements }: { movements: Movement[] | null }) {
  if (!movements) return <Skeleton className="h-80 rounded-2xl" />
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Fecha</TableHead><TableHead>Ingrediente</TableHead><TableHead>Cambio</TableHead><TableHead>Motivo</TableHead><TableHead>Pedido</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const up = m.delta > 0
            const Icon = up ? ArrowUpRight : ArrowDownRight
            return (
              <TableRow key={m.id}>
                <TableCell className="num whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                <TableCell className="font-semibold whitespace-nowrap">{m.ingredient_emoji} {m.ingredient_name ?? m.ingredient_id}</TableCell>
                <TableCell><span className={cn('num inline-flex items-center gap-1 font-bold', up ? 'text-leaf' : 'text-destructive')}><Icon className="size-4" aria-hidden />{up ? '+' : ''}{m.delta} {m.unit}</span></TableCell>
                <TableCell className="capitalize">{m.reason}</TableCell>
                <TableCell className="num text-sm text-muted-foreground">{m.order_id ?? '—'}</TableCell>
              </TableRow>
            )
          })}
          {movements.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Todavía no hay movimientos.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  )
}
