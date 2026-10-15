// Camada única de acesso à API do backend: todas as chamadas HTTP do site do
// cliente (cardápio) passam por aqui, então as telas não repetem fetch/erro.
import { apiErrorFromResponse, networkError } from './apiError'

const API = '/api'

// Faz a chamada HTTP e já trata os casos comuns: monta a URL, manda JSON,
// devolve null em respostas "sem conteúdo" (204) e transforma erro HTTP em
// exceção JS com a mensagem que o backend mandou.
async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    // fetch só rejeita quando nem chegou resposta (servidor fora do ar, sem rede).
    throw networkError()
  }

  if (res.status === 204) return null

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw apiErrorFromResponse(res.status, body)
  }
  return body
}

export function fetchCategories() {
  return request('/categories')
}

export function fetchMenuItems(availableOnly = false) {
  const q = availableOnly ? '?availableOnly=true' : ''
  return request(`/menuitems${q}`)
}

export function fetchRestaurant() {
  return request('/restaurant')
}

export function fetchPublicTable(tableId) {
  return request(`/tables/${tableId}/public`)
}

export function joinTable(tableId, payload) {
  return request(`/tables/${tableId}/join`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function validateTableSession(accessToken) {
  return request(`/tables/sessions/${encodeURIComponent(accessToken)}`)
}

export function fetchAddons(menuItemId) {
  return request(`/orders/addons/${menuItemId}`)
}

export function createOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchOrder(publicId) {
  return request(`/orders/public/${publicId}`)
}

export function confirmPayment(publicId) {
  return request(`/orders/public/${publicId}/confirm-payment`, {
    method: 'POST',
  })
}
