import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  href: string
  label?: string
}

export default function BackButton({ href, label = 'Volver' }: BackButtonProps) {
  return (
    <Link 
      href={href} 
      className="px-4 py-2 text-sm font-bold text-[var(--sf-text-main)] bg-[var(--sf-surface)] hover:bg-[var(--sf-bg)] hover:text-primary-500 rounded-xl border border-[var(--sf-border)] transition-all shadow-sm flex items-center gap-2 group shrink-0"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      {label}
    </Link>
  )
}
