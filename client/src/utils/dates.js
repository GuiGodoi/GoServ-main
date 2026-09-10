/** Horário curto a partir de ISO (ex.: 14:35). */
export function formatClock(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Contagem regressiva até expiresAt (mm:ss). */
export function formatCountdown(expiresAt) {
  if (!expiresAt) return '--:--'
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return '00:00'
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}
