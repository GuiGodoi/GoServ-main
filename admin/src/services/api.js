const TOKEN_KEY = 'goserv_admin_token'
const USER_KEY = 'goserv_admin_user'

const API = '/api'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveSession(loginResponse) {
  localStorage.setItem(TOKEN_KEY, loginResponse.token)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      name: loginResponse.name,
      email: loginResponse.email,
      role: loginResponse.role,
      expiresAt: loginResponse.expiresAt,
    })
  )
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearSession()
    if (!path.startsWith('/auth/login')) {
      window.location.assign('/login')
    }
  }

  if (res.status === 204) return null

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message || `Erro ${res.status}`)
  }
  return body
}

export const api = {
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  getCategories: () => request('/categories'),
  createCategory: (payload) =>
    request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getMenuItems: () => request('/menuitems'),
  createMenuItem: (payload) =>
    request('/menuitems', { method: 'POST', body: JSON.stringify(payload) }),
  updateMenuItem: (id, payload) =>
    request(`/menuitems/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMenuItem: (id) => request(`/menuitems/${id}`, { method: 'DELETE' }),
  uploadMenuItemPhoto: async (id, file) => {
    const headers = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const body = new FormData()
    body.append('file', file)

    const res = await fetch(`${API}/menuitems/${id}/photo`, {
      method: 'POST',
      headers,
      body,
    })

    if (res.status === 401) {
      clearSession()
      window.location.assign('/login')
    }

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Erro ${res.status}`)
    return data
  },
  deleteMenuItemPhoto: (id) =>
    request(`/menuitems/${id}/photo`, { method: 'DELETE' }),

  getTables: () => request('/tables'),
  createTable: (payload) =>
    request('/tables', { method: 'POST', body: JSON.stringify(payload) }),
  openTableSession: (id, payload = { durationMinutes: 120 }) =>
    request(`/tables/${id}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  closeTableSession: (id) =>
    request(`/tables/${id}/sessions/close`, { method: 'POST' }),
  raiseSessionCap: (id, spendingCap) =>
    request(`/tables/${id}/sessions/raise-cap`, {
      method: 'POST',
      body: JSON.stringify({ spendingCap }),
    }),

  getOrders: (status) =>
    request(status ? `/orders?status=${encodeURIComponent(status)}` : '/orders'),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAuditLogs: (take = 50) => request(`/audit?take=${take}`),
  getDailyReport: (date) =>
    request(date ? `/reports/daily?date=${encodeURIComponent(date)}` : '/reports/daily'),

  getQrCatalog: () => request('/qr'),
  rotateDayPasscode: () =>
    request('/qr/day-passcode/rotate', { method: 'POST' }),

  getPromotions: (liveOnly = false) =>
    request(liveOnly ? '/promotions?liveOnly=true' : '/promotions'),
  createPromotion: (payload) =>
    request('/promotions', { method: 'POST', body: JSON.stringify(payload) }),
  updatePromotion: (id, payload) =>
    request(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePromotion: (id) => request(`/promotions/${id}`, { method: 'DELETE' }),
}
