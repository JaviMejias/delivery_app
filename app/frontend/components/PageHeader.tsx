import React from 'react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import BackButton from '@/components/BackButton'

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

  return (
    <div className={`glass-panel p-6 rounded-2xl flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-4 border-l-4 border-l-primary-500 mb-6 bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent relative overflow-hidden`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="flex items-start gap-4 relative z-10">
        {backUrl && (
          <div className="mt-0.5 shrink-0">
            <BackButton href={backUrl} />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black flex items-center gap-3 tracking-tight">
            {icon && <span className="text-3xl sm:text-4xl text-primary-500 drop-shadow-sm scale-110 origin-left">{icon}</span>}
            <span className="bg-gradient-to-r from-primary-500 to-[var(--sf-text-main)] bg-clip-text text-transparent pb-1">
              {title}
            </span>
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-[var(--sf-text-muted)] mt-1.5 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3 w-full 2xl:w-auto shrink-0 mt-4 2xl:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}
