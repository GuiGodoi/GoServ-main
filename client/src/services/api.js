const API = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (res.status === 204) return null

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message || `Erro ${res.status}`)
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
