import React from 'react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  icon?: React.ReactNode
  description?: string
  color?: 'indigo' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose'
  backUrl?: string
  children?: React.ReactNode
}

export default function PageHeader({
  title,
  icon,
  description,
  color = 'indigo',
  backUrl,
  children
}: Props) {

  const borderColors = {
    indigo: 'border-l-indigo-500',
    emerald: 'border-l-emerald-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-500',
    rose: 'border-l-rose-500',
  }

  const borderColorClass = borderColors[color] || borderColors.indigo

  return (
    <div className={`glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 ${borderColorClass} mb-6`}>
      <div className="flex items-start gap-4">
        {backUrl && (
          <Link href={backUrl} className="mt-1 shrink-0 p-2 bg-[var(--sf-bg)] hover:bg-[var(--sf-surface)] rounded-xl border border-[var(--sf-border)] text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors shadow-sm flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3 tracking-tight">
            {icon && <span className="text-3xl sm:text-4xl">{icon}</span>}
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-[var(--sf-text-muted)] mt-1.5 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}
