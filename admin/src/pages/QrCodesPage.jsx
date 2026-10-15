import React from 'react'
import QRCode from 'qrcode'
import { api } from '../services/api'
import {
  EmptyState,
  Icon,
  PageHeader,
  useContentLoading,
  useToast,
  useDialog,
} from '../components/ui'
import './QrCodesPage.css'

// Gera a imagem do QR code (como data URL) a partir do texto/URL que ele deve abrir.
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

// Abre uma nova aba só com o QR code grande, pronta para imprimir (ex: colar na mesa).
function openPreview(dataUrl, title, url) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html lang="pt-BR"><head><title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      *{box-sizing:border-box}
      body{font-family:'IBM Plex Sans',system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f2ed;color:#1c1915}
      .card{width:min(380px,100%);background:#fff;border:1px solid #e7e1d7;border-radius:20px;padding:32px 28px;text-align:center;box-shadow:0 12px 40px rgba(28,25,21,.08)}
      .brand{font-weight:700;letter-spacing:-.02em;color:#1f6b4a;font-size:15px}
      h1{font-size:28px;margin:6px 0 4px;letter-spacing:-.03em}
      .lead{margin:0 0 20px;color:#7a7166;font-size:15px}
      img{width:100%;height:auto;display:block;border-radius:12px}
      .url{margin:16px 0 0;word-break:break-all;font-size:12px;color:#a39a8e;font-family:ui-monospace,monospace}
      button{margin-top:20px;border:0;background:#1f6b4a;color:#fff;font:600 14px system-ui;padding:10px 18px;border-radius:8px;cursor:pointer}
      @media print{body{background:#fff}.card{box-shadow:none;border:0}button{display:none}}
    </style></head><body>
    <div class="card">
      <div class="brand">GoServ</div>
      <h1>${title}</h1>
      <p class="lead">Escaneie com a câmera do celular para ver o cardápio e pedir.</p>
      <img src="${dataUrl}" alt="QR" />
      <p class="url">${url}</p>
      <button onclick="window.print()">Imprimir</button>
    </div>
    </body></html>`)
  w.document.close()
}

// Página com os QR codes fixos: um pro cardápio (só consulta) e um por mesa
// (leva à tela de senha do dia). Também permite gerar uma nova senha do dia.
export default function QrCodesPage() {
  const toast = useToast()
  const [catalog, setCatalog] = React.useState(null)
  const [previews, setPreviews] = React.useState({})
  const [busy, setBusy] = React.useState(false)
  const [booting, setBooting] = React.useState(true)
  const dialog = useDialog()
  useContentLoading(booting)

  const load = React.useCallback(async () => {
    try {
      const data = await api.getQrCatalog()
      setCatalog(data)

      // Gera todas as imagens de QR code de uma vez (cardápio + cada mesa) em paralelo.
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
      toast.error(e)
    } finally {
      setBooting(false)
    }
  }, [toast])

  React.useEffect(() => {
    load()
  }, [load])

  async function rotateCode() {
    const ok = await dialog.confirm({
      title: 'Gerar nova senha do dia?',
      message: 'A senha atual deixa de valer imediatamente para quem ainda não entrou na mesa.',
      confirmLabel: 'Gerar nova senha',
      icon: 'key',
    })
    if (!ok) return

    setBusy(true)
    try {
      await api.rotateDayPasscode()
      await load()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (!catalog && booting) {
    return null
  }

  return (
    <section className="page">
      <PageHeader
        title="QR Codes"
        description="Imprima e cole nas mesas. Quem escaneia a mesa entra com nome + senha do dia; o QR do cardápio é só para consulta."
      />

      {!catalog && (
        <div className="card">
          <EmptyState icon="qr" title="Não foi possível carregar os QR codes">
            <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
              <Icon name="refresh" size={14} />
              Tentar de novo
            </button>
          </EmptyState>
        </div>
      )}

      {catalog && (
        <>
          <div className="qr-top">
            <div className="passcode-card">
              <div className="passcode-head">
                <span className="passcode-icon">
                  <Icon name="key" size={18} />
                </span>
                <span className="eyebrow">Senha do dia · {catalog.dayLabel}</span>
              </div>
              <div className="passcode" aria-label={`Senha ${catalog.dayPasscode}`}>
                {String(catalog.dayPasscode)
                  .split('')
                  .map((ch, i) => (
                    <span key={i}>{ch}</span>
                  ))}
              </div>
              <div className="passcode-foot">
                <p>Informe esta senha aos clientes ao chegarem à mesa.</p>
                <button type="button" className="btn btn-sm passcode-btn" disabled={busy} onClick={rotateCode}>
                  <Icon name="refresh" size={14} />
                  Gerar nova
                </button>
              </div>
            </div>

            <QrCard
              title="Cardápio"
              subtitle="Somente consulta"
              url={catalog.menuUrl}
              img={previews.menu}
              filename="goserv-cardapio.png"
              featured
            />
          </div>

          <div className="section-title">
            <h2>Mesas</h2>
            <span className="count">{catalog.tables.length}</span>
          </div>

          {catalog.tables.length === 0 ? (
            <div className="card">
              <EmptyState icon="table" title="Nenhuma mesa cadastrada">
                Cadastre mesas na tela Mesas para gerar os QR codes.
              </EmptyState>
            </div>
          ) : (
            <div className="qr-grid">
              {catalog.tables.map((table) => (
                <QrCard
                  key={table.id}
                  title={table.label}
                  subtitle="Pedido na mesa"
                  url={table.url}
                  img={previews[`t-${table.id}`]}
                  filename={`goserv-${table.label.replace(/\s+/g, '-').toLowerCase()}.png`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function QrCard({ title, subtitle, url, img, filename, featured = false }) {
  return (
    <article className={`qr-card ${featured ? 'featured' : ''}`}>
      <div className="qr-frame">
        {img ? <img src={img} alt={`QR ${title}`} /> : <span className="qr-ph" />}
      </div>
      <div className="qr-meta">
        <span className="eyebrow">{subtitle}</span>
        <h3>{title}</h3>
        <p className="qr-url" title={url}>{url}</p>
        <div className="qr-actions">
          <button
            type="button"
            className="btn btn-sm"
            disabled={!img}
            onClick={() => downloadPng(img, filename)}
          >
            <Icon name="download" size={14} />
            PNG
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Abrir para imprimir"
            aria-label={`Imprimir QR ${title}`}
            disabled={!img}
            onClick={() => openPreview(img, title, url)}
          >
            <Icon name="printer" size={16} />
          </button>
          <a
            className="icon-btn"
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Abrir link"
            aria-label={`Abrir link de ${title}`}
          >
            <Icon name="external" size={16} />
          </a>
        </div>
      </div>
    </article>
  )
}
