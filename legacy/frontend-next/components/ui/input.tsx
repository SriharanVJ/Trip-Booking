import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, onRightIconClick, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    React.useEffect(() => {
      setHasValue(props.value !== undefined && props.value !== '')
    }, [props.value])

    return (
      <div className="relative">
        {label && (
          <label
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 px-2 bg-black/50 backdrop-blur-sm text-sm transition-all duration-300 pointer-events-none z-10',
              isFocused || hasValue
                ? 'text-xs -translate-y-10 text-gold'
                : 'text-warm-white-dark/50'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-12 w-full rounded-xl border-2 bg-black/50 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background',
              'text-warm-white placeholder:text-warm-white-dark/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20',
              'focus-visible:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-300',
              error && 'border-destructive focus-visible:ring-destructive',
              !error && 'border-gold/20 hover:border-gold/40 focus:border-gold/60',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              (isFocused || hasValue) && 'pt-6 pb-2',
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
            <span className="w-1 h-1 bg-destructive rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
