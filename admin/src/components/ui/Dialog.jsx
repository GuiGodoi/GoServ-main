// Substitui os confirm()/prompt() nativos do navegador por um modal no
// visual do painel. Uso: const dialog = useDialog()
//   if (await dialog.confirm({ title: 'Excluir?' })) { ... }
//   const valor = await dialog.prompt({ title: 'Novo valor' })  // null = cancelou
import React from 'react'
import Icon from './Icon'

const DialogContext = React.createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = React.useState(null)
  const [value, setValue] = React.useState('')

  const open = React.useCallback(
    (opts) =>
      new Promise((resolve) => {
        setValue(opts.defaultValue ?? '')
        setDialog({ ...opts, resolve })
      }),
    []
  )

  const api = React.useMemo(
    () => ({
      confirm: (opts) => open({ kind: 'confirm', ...opts }),
      prompt: (opts) => open({ kind: 'prompt', ...opts }),
    }),
    [open]
  )

  const close = React.useCallback(
    (result) => {
      dialog?.resolve(result)
      setDialog(null)
    },
    [dialog]
  )

  React.useEffect(() => {
    if (!dialog) return undefined
    function onKey(e) {
      if (e.key === 'Escape') close(dialog.kind === 'prompt' ? null : false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dialog, close])

  function handleSubmit(e) {
    e.preventDefault()
    close(dialog.kind === 'prompt' ? value : true)
  }

  const cancelValue = dialog?.kind === 'prompt' ? null : false
  const danger = dialog?.tone === 'danger'

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && (
        <div className="dialog-overlay" onMouseDown={() => close(cancelValue)}>
          <form
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dialog-body">
              <span className={`dialog-icon ${danger ? 'danger' : ''}`}>
                <Icon name={dialog.icon || (danger ? 'trash' : 'alert')} size={20} />
              </span>
              <div className="dialog-text">
                <h2 id="dialog-title">{dialog.title}</h2>
                {dialog.message && <p>{dialog.message}</p>}
                {dialog.kind === 'prompt' && (
                  <label className="field">
                    {dialog.inputLabel && <span>{dialog.inputLabel}</span>}
                    <input
                      className="input"
                      autoFocus
                      inputMode={dialog.inputMode}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => close(cancelValue)}
              >
                {dialog.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="submit"
                className={`btn ${danger ? 'btn-danger' : ''}`}
                autoFocus={dialog.kind !== 'prompt'}
              >
                {dialog.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  return React.useContext(DialogContext)
}
