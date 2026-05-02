import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-backdrop-enter"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizes[size]} bg-jade-800 rounded-xl border border-jade-700/30 shadow-2xl shadow-black/40 max-h-[90vh] flex flex-col animate-modal-enter`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-jade-700/25 shrink-0">
          <h2 className="text-base font-semibold text-jade-50">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-jade-warm/60 hover:text-jade-50 hover:bg-jade-700/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 sm:px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
