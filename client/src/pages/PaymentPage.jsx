import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { confirmPayment, fetchOrder } from '../services/api'
import { connectOrderHub } from '../services/orderHub'
import { useKioskIdleReset } from '../hooks/useKioskIdleReset'
import ClientTopBar from '../components/ClientTopBar'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import { formatPrice, formatCountdown } from '../utils'
import './PaymentPage.css'

// Tela de pagamento (Pix simulado): mostra o QR code/código copia-e-cola e
// espera a confirmação — tanto via SignalR (se outro lugar confirmar) quanto
// pelo botão "Simular pagamento", que chama o webhook fake do backend.
export default function PaymentPage() {
  const { orderId: publicId, tableToken } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = React.useState(null)
  const [error, setError] = React.useState('')
  const toast = useToast()
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [qrUrl, setQrUrl] = React.useState('')
  const [tick, setTick] = React.useState(0)

  const menuPath = tableToken ? `/mesa/${tableToken}` : '/'
  const trackPath = tableToken
    ? `/mesa/${tableToken}/pedido/${publicId}`
    : `/pedido/${publicId}`

  useKioskIdleReset(menuPath)

  // Só existe para forçar o componente a re-renderizar a cada segundo, assim
  // o contador regressivo (formatCountdown) na tela vai atualizando sozinho.
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let connection

    async function boot() {
      let loaded = false
      try {
        const initial = await fetchOrder(publicId)
        if (cancelled) return
        setOrder(initial)
        loaded = true

        if (initial.status !== 'AwaitingPayment') {
          navigate(trackPath, { replace: true })
          return
        }

        connection = connectOrderHub({
          publicId,
          onUpdated: (updated) => {
            if (cancelled) return
            setOrder(updated)
            if (updated.status !== 'AwaitingPayment') {
              navigate(trackPath, { replace: true })
            }
          },
        })
        await connection.start()
        await connection.invoke('WatchOrder', publicId)
      } catch (e) {
        if (cancelled) return
        // Pedido carregou mas o "ao vivo" falhou: o botão de simular continua funcionando.
        if (loaded) {
          toast.error('A confirmação automática pode demorar. Recarregue a página se travar.', {
            title: 'Atualização ao vivo indisponível',
          })
        } else {
          setError(e.message || 'Falha ao carregar pagamento')
        }
      }
    }

    boot()
    return () => {
      cancelled = true
      connection?.stop()
    }
  }, [publicId, navigate, trackPath, toast])

  // Gera a imagem do QR code a partir do código Pix "copia e cola".
  const pixCode = order?.pixCopyPaste
  React.useEffect(() => {
    if (!pixCode) return undefined
    let cancelled = false
    QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 440,
      color: { dark: '#15110d', light: '#ffffff' },
    })
      .then((url) => !cancelled && setQrUrl(url))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pixCode])

  async function copyPix() {
    if (!order?.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(order.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Seu navegador bloqueou a cópia. Segure o código para copiar manualmente.', {
        title: 'Não foi possível copiar',
      })
    }
  }

  // Em produção, quem chamaria isso seria o provedor de pagamento (Pix) via
  // webhook; aqui simulamos clicando no botão, para poder testar o fluxo sem
  // integração real de pagamento.
  async function simulateWebhook() {
    setBusy(true)
    try {
      const updated = await confirmPayment(publicId)
      setOrder(updated)
      navigate(trackPath, { replace: true })
    } catch (e) {
      toast.error(e, { title: 'Pagamento não confirmado' })
    } finally {
      setBusy(false)
    }
  }

  // "tick" não é usado diretamente — ele só existe para forçar o re-render do
  // countdown a cada segundo (efeito acima). Essa linha evita aviso de "variável não usada".
  void tick

  if (error && !order) {
    return (
      <div className="page">
        <ClientTopBar title="Pagamento" backTo={menuPath} />
        <div className="screen-state">
          <span className="state-icon">
            <Icon name="alert" size={28} />
          </span>
          <h2>Não foi possível carregar</h2>
          <p>{error}</p>
          <Link to={menuPath} className="btn btn-secondary">Voltar ao cardápio</Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <ClientTopBar title="Pagamento" />
        <p className="muted pay-loading">Carregando pagamento…</p>
      </div>
    )
  }

  const expired =
    order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() < Date.now()

  return (
    <div className="page pay-page">
      <ClientTopBar tableLabel={order.tableLabel} title="Pagamento" />

      <div className="pay-amount">
        <span className="eyebrow">Total a pagar</span>
        <strong className="display">{formatPrice(order.total)}</strong>
        <span className={`pay-timer ${expired ? 'expired' : ''}`}>
          <Icon name="clock" size={14} />
          {expired ? 'Pix expirado' : `Expira em ${formatCountdown(order.paymentExpiresAt)}`}
        </span>
      </div>

      <div className={`pay-card ${expired ? 'is-expired' : ''}`}>
        <div className="pay-qr">
          {qrUrl ? <img src={qrUrl} alt="QR code Pix" /> : <span className="qr-skeleton" />}
        </div>
        <p className="pay-instructions">
          Abra o app do seu banco, escolha <strong>Pagar com Pix</strong> e
          escaneie o código — ou copie o código abaixo.
        </p>
        {order.pixCopyPaste && (
          <button type="button" className={`pix-code ${copied ? 'copied' : ''}`} onClick={copyPix}>
            <span className="pix-text">{order.pixCopyPaste}</span>
            <span className="pix-copy">
              <Icon name={copied ? 'check' : 'copy'} size={16} />
              {copied ? 'Copiado!' : 'Copiar'}
            </span>
          </button>
        )}
      </div>

      <div className="pay-wait">
        <span className="wait-spinner" aria-hidden="true" />
        <div>
          <strong>Aguardando confirmação…</strong>
          <p>O pedido vai para a cozinha assim que o pagamento for confirmado.</p>
        </div>
      </div>

      {!expired && (
        <button
          type="button"
          className="btn btn-secondary btn-block demo-btn"
          disabled={busy}
          onClick={simulateWebhook}
        >
          {busy ? 'Confirmando…' : 'Simular pagamento (demo)'}
        </button>
      )}
    </div>
  )
}
