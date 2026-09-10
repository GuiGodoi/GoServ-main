/** Converte ISO para valor de input datetime-local. */
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Intervalo padrão: agora → +7 dias (datetime-local). */
export function defaultDateRange() {
  const start = new Date()
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  return {
    startsAt: toLocalInput(start.toISOString()),
    endsAt: toLocalInput(end.toISOString()),
  }
}

/** Data de hoje no formato YYYY-MM-DD (input type="date"). */
export function todayInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Rótulo amigável do dia a partir de YYYY-MM-DD. */
export function formatDayLabel(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `HOJE · ${d}/${m}/${y}`
}

/** Tempo decorrido desde ISO, em minutos (ex.: "12 min"). */
export function elapsedLabel(iso) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  return `${mins} min`
}

/** Data/hora curta em pt-BR. */
export function formatDateTime(iso, options) {
  return new Date(iso).toLocaleString('pt-BR', options)
}
