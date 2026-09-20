'use client'

import { useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './date-picker.css'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: Date
  placeholder?: string
  required?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = 'Select date',
  required = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Parse the date string safely, handling timezone issues
  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  })() : null

  const handleChange = (date: Date | null) => {
    if (date) {
      // Format as YYYY-MM-DD (local time, not UTC)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formatted = `${year}-${month}-${day}`
      onChange(formatted)
      setIsOpen(false) // Close calendar after date selection
    } else {
      onChange('')
    }
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={handleChange}
      minDate={minDate}
      open={isOpen}
      onInputClick={toggleOpen}
      onClickOutside={() => setIsOpen(false)}
      onSelect={handleChange}
      dateFormat="MMM dd, yyyy"
      placeholderText={placeholder}
      required={required}
      className={className}
      calendarClassName="dark-calendar"
      popperPlacement="bottom-start"
      wrapperClassName="w-full"
    />
  )
}
