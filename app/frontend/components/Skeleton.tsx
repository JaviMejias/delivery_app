import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  let roundedClass = 'rounded-xl'
  if (variant === 'circular') roundedClass = 'rounded-full'
  if (variant === 'text') roundedClass = 'rounded-md h-4'

  return (
    <div 
      className={`animate-pulse bg-[var(--sf-border)] opacity-60 ${roundedClass} ${className}`}
    ></div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-1/3 h-5" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="rectangular" className="w-full h-20" />
      <div className="flex gap-2">
        <Skeleton variant="text" className="w-1/4" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
    </div>
  )
}
