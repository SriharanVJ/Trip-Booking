'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<'div'> & {
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date | { from?: Date; to?: Date } | Date[]
  onSelect?: (date: Date | { from?: Date; to?: Date } | Date[] | undefined) => void
  disabled?: (date: Date) => boolean
  fromDate?: Date
  toDate?: Date
  numberOfMonths?: number
  className?: string
}

function Calendar({
  mode = 'single',
  selected,
  onSelect,
  disabled,
  fromDate,
  toDate,
  numberOfMonths = 1,
  className,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateSelected = (date: Date) => {
    if (!selected) return false

    if (mode === 'single' && selected instanceof Date) {
      return date.toDateString() === selected.toDateString()
    }

    if (mode === 'range' && typeof selected === 'object' && 'from' in selected) {
      const { from, to } = selected
      if (!from) return false

      const isStart = date.toDateString() === from.toDateString()
      const isEnd = to && date.toDateString() === to.toDateString()
      const isMiddle = from && to && date > from && date < to

      return isStart || isEnd || isMiddle
    }

    return false
  }

  const isDateInRange = (date: Date) => {
    if (mode !== 'range' || typeof selected !== 'object' || !('from' in selected)) return false

    const { from, to } = selected
    if (!from || !to) return false

    return date >= from && date <= to
  }

  const isDateDisabled = (date: Date) => {
    if (disabled && disabled(date)) return true
    if (fromDate && date < fromDate) return true
    if (toDate && date > toDate) return true
    return false
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (mode === 'single') {
      onSelect?.(date)
      return
    }

    if (mode === 'range' && typeof selected === 'object' && !Array.isArray(selected)) {
      const { from, to } = selected as { from?: Date; to?: Date }

      if (!from || (from && to)) {
        // Start new range
        onSelect?.({ from: date, to: undefined })
      } else if (date < from) {
        // Date is before start, make it the new start
        onSelect?.({ from: date, to: from })
      } else {
        // Complete the range
        onSelect?.({ from, to: date })
      }
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const months = []
  for (let i = 0; i < numberOfMonths; i++) {
    const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i)
    months.push(
      <div key={i} className="flex-1 min-w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">
            {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          {i === 0 && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={previousMonth} className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(monthDate).map((date, index) => (
            <div key={index}>
              {date ? (
                <button
                  type="button"
                  disabled={isDateDisabled(date)}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'h-9 w-9 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isDateSelected(date) && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                    isDateInRange(date) && !isDateSelected(date) && 'bg-accent/50',
                    isDateDisabled(date) && 'text-muted-foreground opacity-50'
                  )}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div className={cn('flex gap-4', numberOfMonths > 1 && 'flex-wrap')}>
        {months}
      </div>
    </div>
  )
}

export { Calendar }
