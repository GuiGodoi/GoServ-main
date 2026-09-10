import React from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImageBlob } from '../../utils/cropImage'

/**
 * Modal de recorte 1:1 (react-easy-crop): zoom, pan e rotação.
 */
export default function ImageCropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  const onCropComplete = React.useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setBusy(true)
    setError('')
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, rotation)
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onConfirm?.(file)
    } catch (e) {
      setError(e.message || 'Não foi possível recortar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label="Recortar foto">
      <div className="crop-modal">
        <header>
          <h2>Recortar foto (1:1)</h2>
          <button type="button" className="x" onClick={onCancel} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        <div className="controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <label>
            Rotação
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </label>
          <div className="rot-btns">
            <button type="button" className="ghost" onClick={() => setRotation((r) => (r + 270) % 360)}>
              ↺ 90°
            </button>
            <button type="button" className="ghost" onClick={() => setRotation((r) => (r + 90) % 360)}>
              ↻ 90°
            </button>
          </div>
        </div>

        {error && <p className="err">{error}</p>}

        <footer>
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="ok" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Aplicando…' : 'Usar recorte'}
          </button>
        </footer>
      </div>

      <style>{`
        .crop-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(28, 25, 21, 0.55);
          display: grid;
          place-items: center;
          padding: 1rem;
        }
        .crop-modal {
          width: min(100%, 520px);
          background: var(--panel, #fffcf7);
          border: 1px solid var(--line, #ddd5c8);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .crop-modal header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--line, #ddd5c8);
        }
        .crop-modal h2 {
          margin: 0;
          font-size: 1rem;
        }
        .crop-modal .x {
          border: none;
          background: transparent;
          color: var(--ink, #1c1915);
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0 0.25rem;
        }
        .stage {
          position: relative;
          width: 100%;
          height: min(52vh, 360px);
          background: #1c1915;
        }
        .controls {
          padding: 0.85rem 1rem;
          display: grid;
          gap: 0.65rem;
          border-top: 1px solid var(--line, #ddd5c8);
        }
        .controls label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--ink, #1c1915);
        }
        .controls input[type="range"] {
          width: 100%;
        }
        .rot-btns {
          display: flex;
          gap: 0.45rem;
        }
        .crop-modal footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0.85rem 1rem 1rem;
        }
        .crop-modal .ghost {
          border: 1px solid var(--line, #ddd5c8);
          background: #fff;
          color: var(--ink, #1c1915);
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .crop-modal .ok {
          border: none;
          background: var(--accent, #1f6b4a);
          color: #fff;
          padding: 0.5rem 0.95rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .crop-modal .ok:disabled,
        .crop-modal .ghost:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .err {
          margin: 0 1rem;
          color: var(--danger, #a33b2b);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
}
