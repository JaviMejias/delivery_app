import React from 'react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  className?: string
}

export function CustomSwitch({ checked, onChange, label, description, className = '' }: Props) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group select-none ${className}`}>
      <div className="relative flex-shrink-0">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        {/* Track */}
        <div 
          className={`block w-12 h-6 rounded-full transition-colors duration-300 ease-in-out shadow-inner ${
            checked ? 'bg-primary-500' : 'bg-[var(--sf-border)] group-hover:bg-gray-500/50'
          }`}
        ></div>
        {/* Thumb */}
        <div 
          className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out shadow-sm flex items-center justify-center ${
            checked ? 'transform translate-x-6' : ''
          }`}
        >
          {/* Opcional: Pequeño indicador interno para darle más vida */}
          <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${checked ? 'bg-primary-500' : 'bg-gray-300'}`} />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`text-sm font-medium transition-colors ${checked ? 'text-primary-400' : 'text-[var(--sf-text-main)] group-hover:text-[var(--sf-text-muted)]'}`}>
              {label}
            </span>
          )}
          {description && <span className="text-xs text-[var(--sf-text-muted)] mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  )
}
