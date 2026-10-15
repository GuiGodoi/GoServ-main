import React from 'react'
import ImageCropModal from './ImageCropModal'
import Icon from './Icon'

/**
 * Upload 1:1 com modal de recorte (react-easy-crop): zoom, pan e rotação.
 */
export default function ImageUpload({
  label = 'Foto',
  previewUrl = '',
  onFileChange,
  onClear,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  hint = 'JPEG, PNG ou WebP · até 5 MB',
  disabled = false,
}) {
  const inputRef = React.useRef(null)
  const inputId = React.useId()
  const [rawSrc, setRawSrc] = React.useState('')

  function handlePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setRawSrc(url)
    e.target.value = ''
  }

  function closeCrop() {
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    setRawSrc('')
  }

  function confirmCrop(file) {
    closeCrop()
    onFileChange?.(file)
  }

  return (
    <div className="ui-upload">
      {label && <span className="field-label">{label}</span>}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={handlePick}
      />
      <button
        type="button"
        className={`frame ${previewUrl ? 'has' : ''}`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={previewUrl ? 'Trocar foto' : 'Selecionar foto'}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Prévia" />
            <span className="frame-overlay">
              <Icon name="image" size={18} />
              Trocar
            </span>
          </>
        ) : (
          <span className="empty">
            <Icon name="image" size={24} />
            <span>Adicionar foto</span>
          </span>
        )}
      </button>
      {previewUrl && (
        <button
          type="button"
          className="btn btn-ghost btn-sm remove"
          disabled={disabled}
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            onClear?.()
          }}
        >
          <Icon name="trash" size={14} />
          Remover foto
        </button>
      )}
      {hint && <p className="hint">{hint}</p>}

      {rawSrc && (
        <ImageCropModal
          imageSrc={rawSrc}
          onCancel={closeCrop}
          onConfirm={confirmCrop}
        />
      )}

      <style>{`
        .ui-upload {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          align-items: flex-start;
        }
        .ui-upload .frame {
          position: relative;
          width: 168px;
          max-width: 100%;
          aspect-ratio: 1 / 1;
          padding: 0;
          border: 1.5px dashed var(--line-strong);
          border-radius: var(--radius);
          background: var(--panel-2);
          overflow: hidden;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ui-upload .frame:hover:not(:disabled) {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .ui-upload .frame:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--accent-ring);
        }
        .ui-upload .frame.has { border-style: solid; border-color: var(--line); }
        .ui-upload .frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ui-upload .frame-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          background: rgba(28, 25, 21, 0.5);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .ui-upload .frame:hover .frame-overlay { opacity: 1; }
        .ui-upload .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 500;
        }
        .ui-upload .remove { color: var(--danger); padding-left: 0.4rem; }
        .ui-upload .hint { margin: 0; max-width: 168px; }
        .ui-upload .frame:disabled { opacity: 0.6; cursor: wait; }
      `}</style>
    </div>
  )
}
