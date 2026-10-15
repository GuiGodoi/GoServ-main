// Erro padronizado das chamadas à API: guarda o status HTTP e traduz a
// resposta do backend num título + mensagem que dá para mostrar ao cliente.

const TITLES = {
  0: 'Sem conexão',
  400: 'Confira os dados',
  401: 'Sessão expirada',
  403: 'Ação não permitida',
  404: 'Não encontrado',
  409: 'Não foi possível concluir',
  429: 'Muitas tentativas',
}

const DEFAULT_MESSAGES = {
  0: 'Não conseguimos falar com o restaurante. Verifique sua internet e tente de novo.',
  400: 'Algum dado está incorreto. Revise e tente novamente.',
  401: 'A sessão da mesa expirou. Escaneie o QR code da mesa de novo.',
  403: 'Esta ação não está liberada para a sua mesa. Chame um atendente.',
  404: 'Não encontramos o que você procurou. Ele pode ter sido removido.',
  409: 'Os dados mudaram enquanto você estava na tela. Atualize e tente de novo.',
  429: 'Você fez muitas tentativas seguidas. Aguarde um instante.',
}

export class ApiError extends Error {
  constructor(status, message, title) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
  }
}

// Pega a mensagem mais útil do corpo de erro. O backend manda { message },
// e as validações automáticas do ASP.NET mandam { title, errors: { campo: [...] } }.
function messageFromBody(body) {
  if (!body || typeof body !== 'object') return ''
  if (body.message) return body.message
  if (body.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat()[0]
    if (first) return first
  }
  return ''
}

export function apiErrorFromResponse(status, body) {
  const title = TITLES[status] || (status >= 500 ? 'Problema no servidor' : 'Algo deu errado')
  const message =
    messageFromBody(body) ||
    DEFAULT_MESSAGES[status] ||
    (status >= 500
      ? 'O restaurante está com uma instabilidade. Tente novamente em instantes.'
      : `Erro inesperado (código ${status}).`)
  return new ApiError(status, message, title)
}

export function networkError() {
  return new ApiError(0, DEFAULT_MESSAGES[0], TITLES[0])
}
