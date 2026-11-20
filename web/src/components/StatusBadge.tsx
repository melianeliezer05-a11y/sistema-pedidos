import { CheckCheck, ChefHat, Clock, PackageCheck, XCircle, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL } from '@/lib/format'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLE: Record<OrderStatus, { icon: LucideIcon; cls: string }> = {
  pending: { icon: Clock, cls: 'bg-secondary text-secondary-foreground' },
  preparing: { icon: ChefHat, cls: 'bg-primary/15 text-primary dark:text-primary' },
  ready: { icon: PackageCheck, cls: 'bg-leaf/20 text-leaf' },
  delivered: { icon: CheckCheck, cls: 'bg-muted text-muted-foreground' },
  cancelled: { icon: XCircle, cls: 'bg-destructive/10 text-destructive' },
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { icon: Icon, cls } = STYLE[status]
  return (
    <Badge variant="secondary" className={cn('h-6 gap-1 px-2 text-xs font-bold', cls, className)}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  )
}
