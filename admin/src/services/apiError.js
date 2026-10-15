// Erro padronizado das chamadas à API: guarda o status HTTP e traduz a
// resposta do backend num título + mensagem que dá para mostrar ao usuário.

const TITLES = {
  0: 'Sem conexão',
  400: 'Dados inválidos',
  401: 'Sessão expirada',
  403: 'Sem permissão',
  404: 'Não encontrado',
  409: 'Conflito',
  413: 'Arquivo muito grande',
  422: 'Dados inválidos',
  429: 'Muitas tentativas',
}

const DEFAULT_MESSAGES = {
  0: 'Não foi possível falar com o servidor. Verifique sua internet ou se a API está rodando.',
  400: 'Confira os dados informados e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  403: 'Seu perfil não tem permissão para fazer esta ação.',
  404: 'O item que você procurou não existe ou foi removido.',
  409: 'Esta ação conflita com dados já existentes.',
  413: 'O arquivo enviado passa do tamanho permitido.',
  422: 'Confira os dados informados e tente novamente.',
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

export function apiErrorFromResponse(status, body, role) {
  const title = TITLES[status] || (status >= 500 ? 'Erro no servidor' : 'Algo deu errado')
  let message = messageFromBody(body)
  if (!message && status === 403 && role) {
    const perfil = role === 'Kitchen' ? 'Cozinha' : role
    message = `Seu perfil (${perfil}) não tem permissão para fazer esta ação.`
  }
  if (!message) {
    message =
      DEFAULT_MESSAGES[status] ||
      (status >= 500
        ? 'O servidor encontrou um problema. Tente novamente em instantes.'
        : `Erro inesperado (código ${status}).`)
  }
  return new ApiError(status, message, title)
}

export function networkError() {
  return new ApiError(0, DEFAULT_MESSAGES[0], TITLES[0])
}
