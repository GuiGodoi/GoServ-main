import React from 'react'

/** Checkbox reutilizável do admin. */
export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  id,
}) {
  const generatedId = React.useId()
  const inputId = id || generatedId
  return (
    <label className="ui-check" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="box" aria-hidden="true" />
      <span className="txt">{label}</span>
      <style>{`
        .ui-check {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          cursor: pointer;
          user-select: none;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--ink);
        }
        .ui-check input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .ui-check .box {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--line);
          border-radius: 4px;
          background: #fff;
          display: grid;
          place-items: center;
          flex: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .ui-check .box::after {
          content: '';
          width: 9px;
          height: 5px;
          border-left: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) scale(0);
          margin-top: -2px;
          transition: transform 0.12s ease;
        }
        .ui-check input:checked + .box {
          background: var(--accent);
          border-color: var(--accent);
        }
        .ui-check input:checked + .box::after {
          transform: rotate(-45deg) scale(1);
        }
        .ui-check input:focus-visible + .box {
          outline: 2px solid rgba(31, 107, 74, 0.35);
          outline-offset: 2px;
        }
        .ui-check input:disabled + .box,
        .ui-check input:disabled ~ .txt {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </label>
  )
}
