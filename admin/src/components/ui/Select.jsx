import React from 'react'

/** Select com dropdown customizado (padrão visual do admin). */
export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione…',
  required = false,
  disabled = false,
  id,
}) {
  const generatedId = React.useId()
  const inputId = id || generatedId
  const listId = `${inputId}-list`
  const rootRef = React.useRef(null)
  const boxRef = React.useRef(null)
  const listRef = React.useRef(null)
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(-1)
  const [menuWidth, setMenuWidth] = React.useState(null)

  const selected = options.find((o) => String(o.value) === String(value))
  const display = selected?.label ?? placeholder
  const isPlaceholder = !selected

  const close = React.useCallback(() => {
    setOpen(false)
    setHighlight(-1)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    function syncWidth() {
      if (boxRef.current) setMenuWidth(boxRef.current.offsetWidth)
    }
    syncWidth()
    window.addEventListener('resize', syncWidth)
    return () => window.removeEventListener('resize', syncWidth)
  }, [open])

  React.useEffect(() => {
    if (!open) return undefined
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) close()
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  React.useEffect(() => {
    if (!open || highlight < 0) return
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  function pick(optValue) {
    onChange?.(optValue)
    close()
  }

  function toggle() {
    if (disabled) return
    setOpen((v) => {
      const next = !v
      if (next) {
        const idx = options.findIndex((o) => String(o.value) === String(value))
        setHighlight(idx >= 0 ? idx : placeholder != null ? -1 : 0)
      }
      return next
    })
  }

  function onTriggerKeyDown(e) {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        const idx = options.findIndex((o) => String(o.value) === String(value))
        setHighlight(idx >= 0 ? idx : placeholder != null ? -1 : 0)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (highlight === -1 && placeholder != null) {
          pick('')
          return
        }
        const opt = options[highlight]
        if (opt) pick(opt.value)
        return
      }
      if (e.key === 'ArrowDown') {
        setHighlight((h) => Math.min(options.length - 1, (h < 0 ? -1 : h) + 1))
      }
      if (e.key === 'ArrowUp') {
        setHighlight((h) => Math.max(placeholder != null ? -1 : 0, (h < 0 ? 0 : h) - 1))
      }
    }
  }

  return (
    <div className={`ui-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={rootRef}>
      {label && (
        <span className="lbl" id={`${inputId}-label`}>
          {label}
          {required ? ' *' : ''}
        </span>
      )}

      <div className="box" ref={boxRef}>
        {/* Mantém validação HTML5 / submit em forms nativos */}
        <select
          id={inputId}
          className="native"
          required={required}
          disabled={disabled}
          value={value ?? ''}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
        >
          {placeholder != null && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`trigger ${isPlaceholder ? 'ph' : ''}`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={label ? `${inputId}-label` : undefined}
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="val">{String(display).trimEnd()}</span>
          <span className="chev" aria-hidden="true" />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            className="menu"
            role="listbox"
            aria-labelledby={label ? `${inputId}-label` : undefined}
            style={menuWidth ? { width: menuWidth } : undefined}
          >
            {placeholder != null && (
              <li
                role="option"
                aria-selected={isPlaceholder}
                title={String(placeholder).trimEnd()}
                className={`opt ph ${isPlaceholder ? 'sel' : ''} ${highlight === -1 ? 'hi' : ''}`}
                data-idx={-1}
                onMouseEnter={() => setHighlight(-1)}
                onClick={() => pick('')}
              >
                {String(placeholder).trimEnd()}
              </li>
            )}
            {options.map((opt, i) => {
              const sel = String(opt.value) === String(value)
              const labelText = String(opt.label ?? '').trimEnd()
              return (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={sel}
                  title={labelText}
                  className={`opt ${sel ? 'sel' : ''} ${highlight === i ? 'hi' : ''}`}
                  data-idx={i}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(opt.value)}
                >
                  {labelText}
                </li>
              )
            })}
            {options.length === 0 && (
              <li className="opt empty" role="presentation">
                Nenhuma opção
              </li>
            )}
          </ul>
        )}
      </div>

      <style>{`
        .ui-select {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          width: 100%;
          min-width: 0;
          font-size: 0.85rem;
          font-weight: 500;
          z-index: 1;
        }
        .ui-select.open { z-index: 40; }
        .ui-select .lbl { color: var(--ink); }
        .ui-select .box {
          position: relative;
          width: 100%;
          min-width: 0;
        }
        .ui-select .native {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          width: 0;
          height: 0;
          overflow: hidden;
        }
        .ui-select .trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          width: 100%;
          min-height: 42px;
          border: 1px solid var(--line) !important;
          border-radius: 8px;
          padding: 0.55rem 0.7rem;
          background: #fff !important;
          color: var(--ink) !important;
          font: inherit;
          font-weight: 500 !important;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .ui-select .trigger.ph { color: var(--muted) !important; font-weight: 400 !important; }
        .ui-select .trigger:hover:not(:disabled) {
          border-color: #c9bfb0 !important;
          background: #fff !important;
        }
        .ui-select.open .trigger,
        .ui-select .trigger:focus-visible {
          outline: 2px solid rgba(31, 107, 74, 0.25);
          outline-offset: 1px;
          border-color: var(--accent) !important;
        }
        .ui-select .trigger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ui-select .val {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ui-select .chev {
          flex: none;
          width: 8px;
          height: 8px;
          border-right: 2px solid var(--muted);
          border-bottom: 2px solid var(--muted);
          transform: rotate(45deg);
          margin-top: -3px;
          transition: transform 0.15s ease;
        }
        .ui-select.open .chev {
          transform: rotate(225deg);
          margin-top: 3px;
        }
        .ui-select .menu {
          position: absolute;
          left: 0;
          top: calc(100% + 4px);
          width: 100%;
          margin: 0;
          padding: 0.35rem;
          list-style: none;
          background: var(--panel, #fffcf7);
          border: 1px solid var(--line);
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(28, 25, 21, 0.12);
          max-height: 240px;
          overflow-x: hidden;
          overflow-y: auto;
          z-index: 50;
          box-sizing: border-box;
        }
        .ui-select .opt {
          display: block;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 0.55rem 0.7rem;
          border-radius: 7px;
          cursor: pointer;
          color: var(--ink);
          font-weight: 500;
          font-size: 0.9rem;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ui-select .opt.ph {
          color: var(--muted);
          font-weight: 400;
        }
        .ui-select .opt.empty {
          color: var(--muted);
          cursor: default;
          font-weight: 400;
        }
        .ui-select .opt.hi {
          background: var(--bg, #f4efe6);
        }
        .ui-select .opt.sel {
          color: var(--accent);
          background: rgba(31, 107, 74, 0.1);
        }
        .ui-select .opt.sel.hi {
          background: rgba(31, 107, 74, 0.16);
        }
      `}</style>
    </div>
  )
}
