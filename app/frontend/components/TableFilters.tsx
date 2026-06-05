import React from 'react'
import { Search as SearchIcon, Filter, Loader2, X } from 'lucide-react'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'

interface TableFiltersProps {
  children: React.ReactNode
  onApply?: () => void
  onClear?: () => void
  isLoading?: boolean
  filterText?: string
}

export function TableFilters({ children, onApply, onClear, isLoading = false, filterText = 'Filtrar' }: TableFiltersProps) {
  return (
    <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
      {children}

      {(onApply || onClear) && (
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
          {onClear && (
            <button
              onClick={onClear}
              type="button"
              disabled={isLoading}
              className="px-4 py-2 bg-[var(--sf-bg)] text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] border border-[var(--sf-border)] rounded-xl text-sm font-medium transition-colors h-[42px]"
            >
              Limpiar
            </button>
          )}
          {onApply && (
            <button
              onClick={onApply}
              type="button"
              disabled={isLoading}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 h-[42px] shadow-sm shadow-primary-500/20 flex-1 sm:flex-none"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />}
              {isLoading ? 'Filtrando...' : filterText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface SearchProps {
  value: string
  onChange: (val: string) => void
  onSearch?: () => void
  placeholder?: string
  label?: string
  className?: string
}

TableFilters.Search = function TableFiltersSearch({ value, onChange, onSearch, placeholder = 'Buscar...', label, className = 'flex-1 min-w-[250px]' }: SearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1.5">{label}</label>}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-[var(--sf-text-muted)]" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-9 pr-3 py-2.5 border border-[var(--sf-border)] rounded-xl leading-5 bg-[var(--sf-bg)] text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 sm:text-sm transition-all h-[42px]"
        />
        {value && onSearch && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface SelectProps {
  label?: string
  value: string
  onChange: (val: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  className?: string
}

TableFilters.Select = function TableFiltersSelect({ label, value, onChange, options, placeholder = 'Todos', className = 'flex-1 min-w-[200px]' }: SelectProps) {
  const currentOption = options.find(o => o.value.toString() === value.toString()) || { value: '', label: placeholder }

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1.5">{label}</label>}
      <CustomSelect
        value={value ? currentOption : null}
        onChange={(v: any) => onChange(v?.value || '')}
        options={options}
        placeholder={placeholder}
      />
    </div>
  )
}

interface DateProps {
  label?: string
  value: string
  onChange: (val: string) => void
  className?: string
}

TableFilters.Date = function TableFiltersDate({ label, value, onChange, className = 'flex-1 min-w-[160px]' }: DateProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1.5">{label}</label>}
      <CustomDatePicker
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

interface TabsProps {
  value: string
  onChange: (val: string) => void
  options: { label: string; value: string; color?: 'primary' | 'emerald' | 'rose' | 'amber' | 'blue' }[]
  className?: string
}

TableFilters.Tabs = function TableFiltersTabs({ value, onChange, options, className = 'flex-none' }: TabsProps) {
  return (
    <div className={`${className} flex items-center gap-1.5 bg-[var(--sf-bg)] p-1 rounded-xl border border-[var(--sf-border)] overflow-x-auto scrollbar-hide`}>
      {options.map((opt) => {
        const isSelected = value === opt.value
        let selectedClass = 'bg-[var(--sf-surface)] text-[var(--sf-text-main)] shadow-sm border border-[var(--sf-border)]'
        
        if (isSelected && opt.color === 'emerald') selectedClass = 'bg-[var(--sf-surface)] text-emerald-500 shadow-sm border border-emerald-500/20'
        else if (isSelected && opt.color === 'rose') selectedClass = 'bg-[var(--sf-surface)] text-rose-500 shadow-sm border border-rose-500/20'
        else if (isSelected && opt.color === 'amber') selectedClass = 'bg-[var(--sf-surface)] text-amber-500 shadow-sm border border-amber-500/20'
        else if (isSelected && opt.color === 'primary') selectedClass = 'bg-[var(--sf-surface)] text-primary-500 shadow-sm border border-primary-500/20'

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isSelected 
                ? selectedClass
                : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
