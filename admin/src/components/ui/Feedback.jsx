// Peças visuais pequenas repetidas em todas as telas: cabeçalho de página,
// faixa de erro/sucesso e estado vazio de listas.
import Icon from './Icon'

export function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  )
}

export function Alert({ tone = 'error', children, onClose }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone === 'error' ? 'alert' : 'check'} />
      <div className="alert-body">{children}</div>
      {onClose && (
        <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={onClose}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="empty-state">
      <span className="icon-circle">
        <Icon name={icon} size={22} />
      </span>
      {title && <strong>{title}</strong>}
      {children && <p>{children}</p>}
    </div>
  )
}
