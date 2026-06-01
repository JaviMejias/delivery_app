import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  show: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ show, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[var(--sf-border)]">
          <h2 className="text-xl font-semibold text-[var(--sf-text-main)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
