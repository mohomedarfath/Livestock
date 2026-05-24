import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setRequest({
        title: 'Confirm action',
        description: 'Are you sure you want to continue?',
        confirmLabel: 'Continue',
        cancelLabel: 'Cancel',
        destructive: false,
        ...options,
        resolve,
      })
    })
  }, [])

  const close = useCallback(
    (result) => {
      if (request?.resolve) request.resolve(result)
      setRequest(null)
    },
    [request]
  )

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="presentation"
          style={{ background: 'rgba(20, 16, 12, .42)' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="w-full max-w-md rounded-2xl p-5"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 32px rgba(80,50,20,.16)',
            }}
          >
            <h2 id="confirm-dialog-title" className="m-0 text-h3">
              {request.title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {request.description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => close(false)}>
                {request.cancelLabel}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => close(true)}
                style={
                  request.destructive
                    ? {
                        background:
                          'linear-gradient(135deg, var(--color-danger-500), var(--color-danger-700))',
                      }
                    : undefined
                }
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider')
  return confirm
}
