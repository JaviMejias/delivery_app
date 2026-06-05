import React from 'react'
import Flatpickr from 'react-flatpickr'
import { Spanish } from 'flatpickr/dist/l10n/es.js'
import 'flatpickr/dist/themes/dark.css'
import { Calendar } from 'lucide-react'

interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  required?: boolean
  dateFormat?: string
  maxDate?: string | Date
  minDate?: string | Date
  className?: string
  placeholder?: string
  defaultViewDate?: string | Date
  filterDate?: (date: Date) => boolean
}

export function CustomDatePicker({
  value,
  onChange,
  required,
  dateFormat = "Y-m-d",
  maxDate,
  minDate,
  className = "",
  placeholder = "Seleccionar fecha...",
  defaultViewDate,
  filterDate
}: CustomDatePickerProps) {
  return (
    <div className="relative">
      <Flatpickr
        value={value}
        onChange={([date]) => {
          if (date) {
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            if (dateFormat === "m-Y" || dateFormat === "Y-m") {
              onChange(`${yyyy}-${mm}`)
            } else {
              onChange(`${yyyy}-${mm}-${dd}`)
            }
          } else {
            onChange('')
          }
        }}
        options={{
          locale: Spanish,
          dateFormat: dateFormat,
          altInput: true,
          altFormat: dateFormat === "Y-m-d" ? "d-m-Y" : (dateFormat === "m-Y" || dateFormat === "Y-m" ? "m-Y" : dateFormat),
          maxDate: maxDate,
          minDate: minDate,
          allowInput: true,
          now: defaultViewDate,
          ...(filterDate ? { enable: [filterDate] } : {})
        }}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 ${className}`}
      />
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--sf-text-muted)]">
        <Calendar className="w-4 h-4" />
      </div>
    </div>
  )
}
