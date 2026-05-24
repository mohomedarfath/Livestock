import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import Alert from './Alert'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ variant = 'info', title, message, autoDismissMs = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((items) => [...items, { id, variant, title, message }])
      if (autoDismissMs) {
        window.setTimeout(() => removeToast(id), autoDismissMs)
      }
      return id
    },
    [removeToast]
  )

  const value = useMemo(() => ({ showToast, removeToast }), [removeToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-[80] grid w-[min(420px,calc(100vw-2rem))] gap-3"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="shadow-lg">
            <Alert variant={toast.variant} title={toast.title}>
              <div className="flex items-start gap-3">
                <p className="m-0 flex-1">{toast.message}</p>
                <button
                  type="button"
                  className="focus-ring rounded px-2 font-bold"
                  style={{ color: 'inherit' }}
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  x
                </button>
              </div>
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
