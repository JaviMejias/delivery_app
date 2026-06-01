import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

function Header({ title, subtitle, className = '', children }: { title?: ReactNode, subtitle?: ReactNode, className?: string, children?: ReactNode }) {
  if (!title && !subtitle && !children) return null
  return (
    <div className={`p-5 sm:p-6 border-b border-[var(--sf-border)] flex items-center justify-between gap-4 ${className}`}>
      <div>
        {title && <h2 className="font-semibold text-[var(--sf-text-main)] text-lg">{title}</h2>}
        {subtitle && <p className="text-sm text-[var(--sf-text-muted)] mt-1">{subtitle}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  )
}

function Body({ children, className = '' }: CardProps) {
  return (
    <div className={`p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = Header
Card.Body = Body

export default Card
