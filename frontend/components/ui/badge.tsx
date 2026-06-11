import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Sparkles, Check, AlertTriangle, Info, Flame } from 'lucide-react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border hover:bg-muted/50',
        success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400',
        warning: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400',
        info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
        gradient: 'border-transparent bg-gradient-to-r from-primary to-accent text-white hover:opacity-90',
        glow: 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        glowGreen: 'border-green-30 bg-green-10 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
        premium: 'border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 text-amber-700 dark:text-amber-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: 'sparkles' | 'check' | 'warning' | 'info' | 'flame' | React.ReactNode
  pulse?: boolean
}

const iconMap = {
  sparkles: <Sparkles className="h-3 w-3" />,
  check: <Check className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  info: <Info className="h-3 w-3" />,
  flame: <Flame className="h-3 w-3" />,
}

function Badge({ className, variant, size, icon, pulse = false, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        pulse && 'animate-pulse-soft',
        className
      )}
      {...props}
    >
      {icon && iconMap[icon as keyof typeof iconMap]}
      {icon && typeof icon !== 'string' && icon}
      {props.children}
    </div>
  )
}

export { Badge, badgeVariants }
