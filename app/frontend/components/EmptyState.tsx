import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  type?: 'box' | 'search'
  className?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export default function EmptyState({ 
  title, 
  description, 
  type = 'box',
  className = '',
  action,
  icon
}: EmptyStateProps) {
  
  const imageSrc = type === 'search' 
    ? '/images/illustrations/empty_search.png' 
    : '/images/illustrations/empty_box.png'

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-fade-in ${className}`}>
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full scale-110 group-hover:bg-primary-500/30 transition-all duration-500"></div>
        {icon ? (
          <div className="relative z-10 w-28 h-28 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shadow-xl shadow-primary-500/10 transition-transform duration-500 group-hover:scale-105">
            {icon}
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={title}
            className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl animate-float transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-[var(--sf-text-main)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-[var(--sf-text-muted)] max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
