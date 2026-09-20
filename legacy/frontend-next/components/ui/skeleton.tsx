import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const skeletonVariants = cva(
  'loading-shimmer rounded-md bg-muted overflow-hidden relative',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        primary: 'bg-primary/10',
        card: 'bg-card',
      },
      size: {
        sm: 'h-4',
        default: 'h-5',
        lg: 'h-6',
        xl: 'h-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  circle?: boolean
  rows?: number
}

function Skeleton({
  className,
  variant,
  size,
  circle = false,
  rows,
  ...props
}: SkeletonProps) {
  if (rows) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              skeletonVariants({ variant, size }),
              'w-full',
              i === rows - 1 && 'w-2/3',
              className
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
            {...props}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        skeletonVariants({ variant, size }),
        circle && 'rounded-full',
        className
      )}
      {...props}
    />
  )
}

// Specialized Skeleton Components
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-6 space-y-4 bg-card">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="h-10 w-1/2 rounded-xl" />
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 rounded-xl bg-muted/30">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/50">
          {[1, 2, 3, 4, 5].map((j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 p-6 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, TableSkeleton, StatsSkeleton, skeletonVariants }
