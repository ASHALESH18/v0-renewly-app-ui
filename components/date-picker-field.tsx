'use client'

import { useMemo, useRef } from 'react'
import { Calendar } from 'lucide-react'

interface DatePickerFieldProps {
  label?: string
  value?: string
  onChange?: (date: string) => void
  locale?: string
  disabled?: boolean
  placeholder?: string
}

function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

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
  const inputRef = useRef<HTMLInputElement>(null)

  const displayDate = useMemo(() => {
    if (!value) return placeholder

    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return placeholder
      return formatDateDDMMYYYY(date)
    } catch {
      return placeholder
    }
  }, [value, placeholder])

  const today = getTodayString()

  const handleWrapperClick = () => {
    if (disabled) return
    inputRef.current?.showPicker?.()
    inputRef.current?.focus()
    inputRef.current?.click()
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (!onChange || !newDate) return

    const selectedDate = new Date(newDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    if (selectedDate >= todayDate) {
      onChange(newDate)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground block">
          {label}
        </label>
      )}

      <div
        onClick={handleWrapperClick}
        className="relative w-full h-12 rounded-xl bg-secondary text-foreground cursor-pointer"
      >
        <input
          ref={inputRef}
          type="date"
          value={value || ''}
          min={today}
          onChange={handleDateChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label || placeholder}
        />

        <div className="w-full h-full px-4 flex items-center justify-between pointer-events-none">
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {displayDate}
          </span>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {value && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-semibold text-foreground">{displayDate}</span>
        </p>
      )}
    </div>
  )
}