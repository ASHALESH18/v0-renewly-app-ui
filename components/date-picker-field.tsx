'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { formatDateShort } from '@/lib/locale-utils'

interface DatePickerFieldProps {
  label?: string
  value?: string
  onChange?: (date: string) => void
  locale?: string
  disabled?: boolean
  placeholder?: string
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

  // Format display date using locale
  const displayDate = useMemo(() => {
    if (!value) return placeholder
    try {
      return formatDateShort(new Date(value), locale)
    } catch {
      return placeholder
    }
  }, [value, locale, placeholder])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (onChange) {
      onChange(newDate)
    }
    setOpen(false)
  }

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
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {displayDate}
          </span>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>

        {open && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background border border-border rounded-lg shadow-lg z-50">
            <input
              type="date"
              value={value || ''}
              onChange={handleDateChange}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors"
              autoFocus
            />
            {value && (
              <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                Selected: <span className="text-foreground font-medium">{displayDate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
