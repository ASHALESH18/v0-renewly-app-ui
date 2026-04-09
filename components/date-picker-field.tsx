'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'

interface DatePickerFieldProps {
  label?: string
  value?: string
  onChange?: (date: string) => void
  locale?: string
  disabled?: boolean
  placeholder?: string
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Get today's date in YYYY-MM-DD format (for date input min attribute)
 */
function getTodayString(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DatePickerField({
  label,
  value,
  onChange,
  locale = 'en-IN',
  disabled = false,
  placeholder = 'Select a date',
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  // Format display date as DD/MM/YYYY
  const displayDate = useMemo(() => {
    if (!value) return placeholder
    try {
      const date = new Date(value)
      // Validate the date
      if (isNaN(date.getTime())) return placeholder
      return formatDateDDMMYYYY(date)
    } catch {
      return placeholder
    }
  }, [value, placeholder])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (onChange && newDate) {
      // Validate that the selected date is in the future
      const selectedDate = new Date(newDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate >= today) {
        onChange(newDate)
      }
    }
    setOpen(false)
  }

  const today = getTodayString()

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between h-12"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {displayDate}
          </span>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>

        {open && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background border border-gold/20 rounded-xl shadow-luxury z-50">
            <div className="space-y-3">
              <input
                type="date"
                value={value || ''}
                onChange={handleDateChange}
                min={today}
                className="w-full px-4 py-2 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors cursor-pointer"
                autoFocus
              />
              {value && (
                <div className="pt-3 border-t border-gold/10 text-sm text-muted-foreground">
                  Selected: <span className="text-foreground font-medium">{displayDate}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
