import React from 'react'
import ImageCropModal from './ImageCropModal'

/**
 * Upload 1:1 com modal de recorte (react-easy-crop): zoom, pan e rotação.
 */
export default function ImageUpload({
  label = 'Foto',
  previewUrl = '',
  onFileChange,
  onClear,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  hint = 'JPEG/PNG/WebP · máx. 5 MB · recorte 1:1',
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
      {label && <span className="lbl">{label}</span>}
      <div className="row">
        <div className={`frame ${previewUrl ? 'has' : ''}`}>
          {previewUrl ? (
            <img src={previewUrl} alt="Prévia" />
          ) : (
            <span className="empty">1:1</span>
          )}
        </div>
        <div className="btns">
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
            className="primary"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {previewUrl ? 'Trocar foto' : 'Selecionar foto'}
          </button>
          {previewUrl && (
            <button
              type="button"
              className="ghost"
              disabled={disabled}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = ''
                onClear?.()
              }}
            >
              Remover
            </button>
          )}
          {hint && <p className="hint">{hint}</p>}
        </div>
      </div>

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
        }
        .ui-upload .lbl {
          font-size: 0.85rem;
          font-weight: 500;
        }
        .ui-upload .row {
          display: flex;
          gap: 0.85rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .ui-upload .frame {
          width: 112px;
          height: 112px;
          aspect-ratio: 1 / 1;
          border: 1px dashed var(--line);
          border-radius: 10px;
          background: var(--bg);
          overflow: hidden;
          display: grid;
          place-items: center;
          flex: none;
        }
        .ui-upload .frame.has { border-style: solid; }
        .ui-upload .frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ui-upload .empty {
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--muted);
        }
        .ui-upload .btns {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          align-items: flex-start;
        }
        .ui-upload .primary {
          border: none;
          background: var(--accent);
          color: #fff;
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .ui-upload .ghost {
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .ui-upload .hint {
          margin: 0;
          font-size: 0.75rem;
          color: var(--muted);
          max-width: 28ch;
        }
        .ui-upload button:disabled {
          opacity: 0.55;
          cursor: wait;
        }
      `}</style>
    </div>
  )
}
