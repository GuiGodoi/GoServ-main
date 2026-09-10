import React from 'react'
import QRCode from 'qrcode'
import { api } from '../services/api'
import { useContentLoading } from '../components/ui'

async function toDataUrl(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: { dark: '#1c1915', light: '#ffffff' },
  })
}

function downloadPng(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function openPreview(dataUrl, title, url) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body{font-family:system-ui,sans-serif;margin:0;padding:24px;text-align:center;background:#f3f0ea;color:#1c1915}
      img{width:min(320px,90vw);height:auto;background:#fff;padding:12px;border:1px solid #ddd5c8}
      p{word-break:break-all;font-size:14px;color:#6b635a}
      h1{font-size:18px;margin:0 0 12px}
    </style></head><body>
    <h1>${title}</h1>
    <img src="${dataUrl}" alt="QR" />
    <p>${url}</p>
    </body></html>`)
  w.document.close()
}

export default function QrCodesPage() {
  const [catalog, setCatalog] = React.useState(null)
  const [previews, setPreviews] = React.useState({})
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    setError('')
    try {
      const data = await api.getQrCatalog()
      setCatalog(data)

      const entries = [
        ['menu', data.menuUrl],
        ...data.tables.map((t) => [`t-${t.id}`, t.url]),
      ]
      const next = {}
      await Promise.all(
        entries.map(async ([key, url]) => {
          next[key] = await toDataUrl(url)
        })
      )
      setPreviews(next)
    } catch (e) {
      setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function rotateCode() {
    if (!confirm('Gerar nova senha do dia? A anterior deixa de valer imediatamente.')) {
      return
    }
    setBusy(true)
    try {
      await api.rotateDayPasscode()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!catalog && !error) {
    return null
  }

  return (
    <section className="page">
      <header className="head">
        <div>
          <h1>QR Codes</h1>
          <p>
            Imprima ou abra os códigos. Mesas pedem nome + senha do dia; o cardápio
            é só consulta.
          </p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {catalog && (
        <>
          <div className="pass panel">
            <div>
              <span className="k">Senha do dia · {catalog.dayLabel}</span>
              <strong className="code">{catalog.dayPasscode}</strong>
              <p className="hint">Passe esta senha aos clientes da mesa.</p>
            </div>
            <button type="button" className="ghost" disabled={busy} onClick={rotateCode}>
              Gerar nova senha
            </button>
          </div>

          <article className="card panel">
            <div className="meta">
              <h2>Cardápio (só consulta)</h2>
              <p className="url">{catalog.menuUrl}</p>
              <div className="actions">
                <button
                  type="button"
                  onClick={() =>
                    downloadPng(previews.menu, 'goserv-cardapio.png')
                  }
                  disabled={!previews.menu}
                >
                  Baixar PNG
                </button>
                <button
                  type="button"
                  className="ghost"
                  disabled={!previews.menu}
                  onClick={() =>
                    openPreview(previews.menu, 'Cardápio (consulta)', catalog.menuUrl)
                  }
                >
                  Abrir
                </button>
                <a className="ghost link" href={catalog.menuUrl} target="_blank" rel="noreferrer">
                  Link
                </a>
              </div>
            </div>
            {previews.menu && (
              <img src={previews.menu} alt="QR cardápio" className="qr" />
            )}
          </article>

          <h2 className="section">Mesas</h2>
          <div className="grid">
            {catalog.tables.map((table) => {
              const key = `t-${table.id}`
              const img = previews[key]
              return (
                <article key={table.id} className="card panel">
                  <div className="meta">
                    <h2>{table.label}</h2>
                    <p className="url">{table.url}</p>
                    <div className="actions">
                      <button
                        type="button"
                        disabled={!img}
                        onClick={() =>
                          downloadPng(
                            img,
                            `goserv-${table.label.replace(/\s+/g, '-').toLowerCase()}.png`
                          )
                        }
                      >
                        Baixar PNG
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        disabled={!img}
                        onClick={() => openPreview(img, table.label, table.url)}
                      >
                        Abrir
                      </button>
                      <a className="ghost link" href={table.url} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    </div>
                  </div>
                  {img && <img src={img} alt={`QR ${table.label}`} className="qr" />}
                </article>
              )
            })}
          </div>

          {catalog.tables.length === 0 && (
            <p className="muted">Cadastre mesas em Mesas para gerar os QR codes.</p>
          )}
        </>
      )}

      <style>{`
        .head { margin-bottom: 1rem; }
        h1 { margin: 0 0 0.25rem; font-size: 1.45rem; }
        .head p { margin: 0; color: var(--muted); max-width: 52ch; }
        .error { color: var(--danger); }
        .muted { color: var(--muted); }
        .panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 1rem;
          margin-bottom: 0.85rem;
        }
        .pass {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .k {
          display: block;
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .code {
          display: block;
          font-size: 2rem;
          letter-spacing: 0.12em;
          margin: 0.25rem 0;
          font-family: var(--mono);
        }
        .hint { margin: 0; color: var(--muted); font-size: 0.85rem; }
        .section {
          margin: 1.25rem 0 0.65rem;
          font-size: 1rem;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.85rem;
        }
        .card {
          display: flex;
          gap: 0.85rem;
          align-items: start;
          justify-content: space-between;
        }
        .meta { flex: 1; min-width: 0; }
        .card h2 { margin: 0 0 0.35rem; font-size: 1.05rem; }
        .url {
          margin: 0 0 0.75rem;
          font-size: 0.75rem;
          color: var(--muted);
          word-break: break-all;
          font-family: var(--mono);
        }
        .qr {
          width: 112px;
          height: 112px;
          flex: none;
          border: 1px solid var(--line);
          background: #fff;
          border-radius: 6px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .actions button, .actions .link {
          border: none;
          background: var(--accent);
          color: #fff;
          padding: 0.45rem 0.7rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.82rem;
        }
        .actions button:disabled { opacity: 0.55; cursor: wait; }
        .actions .ghost {
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .actions .link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }
        @media (max-width: 520px) {
          .card { flex-direction: column-reverse; align-items: stretch; }
          .qr { width: 160px; height: 160px; align-self: center; }
        }
      `}</style>
    </section>
  )
}
