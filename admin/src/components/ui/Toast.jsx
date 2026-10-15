// Notificações flutuantes (toasts). Uso em qualquer tela:
//   const toast = useToast()
//   toast.error(err)                 // aceita Error/ApiError ou texto
//   toast.success('Produto salvo')
// Erros de API não tratados (promises rejeitadas sem catch) também viram toast.
import React from 'react'
import { ApiError } from '../../services/apiError'
import Icon from './Icon'

const ToastContext = React.createContext(null)

const DURATION = { error: 6000, success: 3500, info: 4500 }
const ICONS = { error: 'alert', success: 'check', info: 'alert' }

let nextId = 1

// Transforma o que vier (ApiError, Error comum ou texto) em título + mensagem.
function normalize(input, opts = {}) {
  if (input instanceof ApiError) {
    return { title: opts.title ?? input.title, message: input.message }
  }
  if (input instanceof Error) {
    return { title: opts.title, message: input.message || 'Algo deu errado.' }
  }
  return { title: opts.title, message: String(input ?? '') }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const dismiss = React.useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = React.useCallback((tone, input, opts) => {
    const { title, message } = normalize(input, opts)
    setToasts((list) => {
      // Mesma mensagem já visível: só "renova" em vez de empilhar repetida.
      const dup = list.find((t) => t.tone === tone && t.message === message && t.title === title)
      if (dup) {
        return list.map((t) => (t === dup ? { ...t, key: nextId++ } : t))
      }
      const id = nextId++
      return [...list, { id, key: id, tone, title, message }].slice(-4)
    })
  }, [])

  const api = React.useMemo(
    () => ({
      error: (input, opts) => show('error', input, opts),
      success: (input, opts) => show('success', input, opts),
      info: (input, opts) => show('info', input, opts),
    }),
    [show]
  )

  // Rede de segurança: erro de API que escapou de um try/catch.
  React.useEffect(() => {
    function onRejection(e) {
      if (e.reason instanceof ApiError) {
        e.preventDefault()
        api.error(e.reason)
      }
    }
    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [api])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = React.useState(false)
  const duration = DURATION[toast.tone]
  const { id } = toast
  const onClose = React.useCallback(() => onDismiss(id), [onDismiss, id])

  // Fecha sozinho após "duration"; pausa enquanto o mouse está em cima.
  // "toast.key" muda quando a mesma mensagem é repetida, reiniciando o tempo.
  React.useEffect(() => {
    if (paused) return undefined
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [paused, duration, onClose, toast.key])

  return (
    <div
      className={`toast toast-${toast.tone} ${paused ? 'paused' : ''}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="toast-icon">
        <Icon name={ICONS[toast.tone]} size={18} />
      </span>
      <div className="toast-body">
        {toast.title && <strong>{toast.title}</strong>}
        <p>{toast.message}</p>
      </div>
      <button type="button" className="toast-close" aria-label="Fechar" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>
      <span
        key={toast.key}
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  )
}

export function useToast() {
  return React.useContext(ToastContext)
}
