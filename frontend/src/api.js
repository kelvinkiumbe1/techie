const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8082'}/api`
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
    throw new Error(message)
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  login: (payload) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) }).then(handle),
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
  getWorkRate: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
    return fetch(`${BASE}/admin/work-rate?${query}`, { headers: headers() }).then(handle)
  },
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
