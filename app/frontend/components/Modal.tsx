import { useEffect, useRef } from 'react'

interface Props {
  show: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  maxWidth?: string
  headerActions?: React.ReactNode
}

export default function Modal({ show, onClose, title, children, maxWidth = "max-w-lg", headerActions }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (show) {
      if (!dialog.open) {
        dialog.showModal()
      }
      document.body.style.overflow = 'hidden'
    } else {
      if (dialog.open) {
        dialog.close()
      }
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [show])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        onClose()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={`native-modal ${maxWidth} w-full`}
    >
      <div className="flex flex-wrap items-center justify-between p-4 sm:p-6 border-b border-[var(--sf-border)] gap-4 shrink-0">
        <h2 className="text-xl font-semibold text-[var(--sf-text-main)] flex items-center gap-2">{title}</h2>
        <div className="flex items-center gap-4">
          {headerActions}
          <button
            onClick={onClose}
            type="button"
            className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors p-1"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </dialog>
  )
}
