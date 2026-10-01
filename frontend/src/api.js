const localApiOrigin = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `http://${window.location.hostname}:8082`
  : 'http://localhost:8082'
export const API_ORIGIN = import.meta.env.VITE_API_URL || localApiOrigin
const BASE = `${API_ORIGIN}/api`
let token = localStorage.getItem('isp_token')
export function setToken(value) { token = value; if (value) localStorage.setItem('isp_token', value); else localStorage.removeItem('isp_token') }
const headers = () => token ? { 'X-Auth-Token': token } : {}

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch (_) { /* ignore parse errors */ }
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  submitPublicTicket: (payload) => fetch(`${BASE}/public/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(handle),
  trackPublicTickets: (phone) => fetch(`${BASE}/public/tickets/track?phone=${encodeURIComponent(phone)}`).then(handle),
  ratePublicTicket: (id, payload) => fetch(`${BASE}/public/tickets/${id}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(handle),
  login: (payload) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) }).then(handle),
  getProfile: () => fetch(`${BASE}/profile`, { headers: headers() }).then(handle),
  updateProfilePhoto: (profileImage) => fetch(`${BASE}/profile/photo`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ profileImage }) }).then(handle),
  deleteProfilePhoto: () => fetch(`${BASE}/profile/photo`, { method: 'DELETE', headers: headers() }).then(handle),
  changePassword: (payload) => fetch(`${BASE}/profile/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload) }).then(handle),
  getAllTickets: () => fetch(`${BASE}/tickets`, { headers: headers() }).then(handle),
  getEscalated: () => fetch(`${BASE}/tickets/escalated`, { headers: headers() }).then(handle),
  getQueue: (category) => fetch(`${BASE}/tickets/queue/${category}`, { headers: headers() }).then(handle),

  createTicket: (payload) =>
    fetch(`${BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify(payload),
    }).then(handle),

  assignTicket: (ticketId, technicianId) =>
    fetch(`${BASE}/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers() },
      body: JSON.stringify({ technicianId }),
    }).then(handle),

  updateStatus: (ticketId, status) =>
    fetch(`${BASE}/tickets/${ticketId}/status?status=${status}`, {
      method: 'PATCH',
      headers: headers(),
    }).then(handle),
  startWork: (ticketId) => fetch(`${BASE}/tickets/${ticketId}/work/start`, { method: 'POST', headers: headers() }).then(handle),
  stopWork: (ticketId) => fetch(`${BASE}/tickets/${ticketId}/work/stop`, { method: 'POST', headers: headers() }).then(handle),
  fieldUpdate: (ticketId, payload) => fetch(`${BASE}/tickets/${ticketId}/field-update`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload),
  }).then(handle),

  getTechnicians: () => fetch(`${BASE}/technicians`, { headers: headers() }).then(handle),
  createTechnician: (payload) => fetch(`${BASE}/technicians`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload),
  }).then(handle),
  getMyTechnician: () => fetch(`${BASE}/technicians/me`, { headers: headers() }).then(handle),
  updateMyStatus: (status) => fetch(`${BASE}/technicians/me/status?status=${status}`, { method: 'PATCH', headers: headers() }).then(handle),
  updateTechnician: (id, payload) => fetch(`${BASE}/technicians/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload),
  }).then(handle),
  resetTechnicianPassword: (id, password) => fetch(`${BASE}/technicians/${id}/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ password }),
  }).then(handle),
  deleteTechnician: (id) => fetch(`${BASE}/technicians/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
  getDirectMessages: (technicianId) => fetch(`${BASE}/direct-messages/${technicianId}`, { headers: headers() }).then(handle),
  sendDirectMessage: (technicianId, message) => fetch(`${BASE}/direct-messages/${technicianId}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ message }),
  }).then(handle),
  getWorkRate: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
    return fetch(`${BASE}/admin/work-rate?${query}`, { headers: headers() }).then(handle)
  },
  createAdminAccount: (payload) => fetch(`${BASE}/admin/accounts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload),
  }).then(handle),
  getAdminAccounts: () => fetch(`${BASE}/admin/accounts`, { headers: headers() }).then(handle),
  updateAdminStatus: (id, enabled) => fetch(`${BASE}/admin/accounts/${id}/status?enabled=${enabled}`, { method: 'PATCH', headers: headers() }).then(handle),
  deleteAdminAccount: (id) => fetch(`${BASE}/admin/accounts/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
  bulkUpdateTickets: (payload) => fetch(`${BASE}/admin/tickets/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload) }).then(handle),
  exportTickets: () => fetch(`${BASE}/admin/tickets/export`, { headers: headers() }).then(async (res) => {
    if (!res.ok) return handle(res)
    return res.blob()
  }),
  getMessages: (ticketId) => fetch(`${BASE}/tickets/${ticketId}/collaboration/messages`, { headers: headers() }).then(handle),
  sendMessage: (ticketId, message, file) => {
    const body = new FormData()
    if (message) body.append('message', message)
    if (file) body.append('file', file)
    return fetch(`${BASE}/tickets/${ticketId}/collaboration/messages`, { method: 'POST', headers: headers(), body }).then(handle)
  },
  sendSignal: (ticketId, payload) => fetch(`${BASE}/tickets/${ticketId}/collaboration/signals`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify(payload),
  }).then(handle),
  getSignals: (ticketId) => fetch(`${BASE}/tickets/${ticketId}/collaboration/signals`, { headers: headers() }).then(handle),
}
