'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const toastVariants = cva(
  'group relative flex items-center gap-3 w-full p-4 rounded-2xl shadow-premium-lg transition-all duration-300 pointer-events-auto',
  {
    variants: {
      variant: {
        default: 'bg-background border-2 border-border text-foreground',
        success: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800',
        destructive: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-2 border-red-200 dark:border-red-800',
        warning: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-2 border-orange-200 dark:border-orange-800',
        info: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
  destructive: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  default: <Info className="h-5 w-5 text-muted-foreground" />,
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof toastVariants>['variant']
  title?: string
  description?: string
  onClose?: () => void
  duration?: number
  showProgress?: boolean
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', title, description, onClose, duration, showProgress = true, ...props }, ref) => {
    const [progress, setProgress] = React.useState(100)
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
      setIsVisible(true)
      if (duration && showProgress) {
        const interval = 16 // ~60fps
        const decrement = 100 / (duration / interval)
        const timer = setInterval(() => {
          setProgress((prev) => {
            if (prev <= 0) {
              clearInterval(timer)
              onClose?.()
              return 0
            }
            return prev - decrement
          })
        }, interval)
        return () => clearInterval(timer)
      }
    }, [duration, showProgress, onClose])

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant }),
          isVisible ? 'animate-fade-in-up' : 'animate-fade-in',
          className
        )}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {variant && toastIcons[variant]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-sm text-foreground">{title}</p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Progress Bar */}
        {showProgress && duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-current opacity-20 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    )
  }
)
Toast.displayName = 'Toast'

export { Toast, toastVariants }

// Toast Provider Component
export function Toaster({ toasts = [] }: { toasts: Array<{ id: string } & ToastProps> }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
