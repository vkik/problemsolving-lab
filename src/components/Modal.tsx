import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useT } from '../i18n'

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus(), 10)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="no-print fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-navy-950/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`card my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
