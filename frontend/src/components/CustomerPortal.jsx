import React, { useState } from 'react'
import { api } from '../api.js'

export default function CustomerPortal({ onBack }) {
  const [mode, setMode] = useState('submit')
  const [form, setForm] = useState({ customerName: '', customerPhone: '', issueType: 'NO_INTERNET', description: '' })
  const [phone, setPhone] = useState('')
  const [tickets, setTickets] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('')
    try {
      const result = await api.submitPublicTicket(form)
      setMessage(`Ticket #${result.id} was submitted. Save this number for tracking.`)
      setForm({ customerName: '', customerPhone: '', issueType: 'NO_INTERNET', description: '' })
    } catch (err) { setError(err.message || 'Could not submit your request.') }
  }
  async function track(event) {
    event.preventDefault(); setError(''); setMessage('')
    try { setTickets(await api.trackPublicTickets(phone)) }
    catch (err) { setError(err.message || 'Could not find your tickets.') }
  }
  return <main className="customer-portal">
    <div className="portal-card">
      <button className="portal-back" onClick={onBack}>← Staff sign in</button>
      <p className="eyebrow">Techie Tracker</p><h1>How can we help?</h1>
      <div className="portal-tabs"><button className={mode === 'submit' ? 'active' : ''} onClick={() => setMode('submit')}>Report an issue</button><button className={mode === 'track' ? 'active' : ''} onClick={() => setMode('track')}>Track a request</button></div>
      {error && <div className="form-error">{error}</div>}{message && <div className="success-state">{message}</div>}
      {mode === 'submit' ? <form onSubmit={submit} className="portal-form">
        <label>Name<input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
        <label>Phone number<input required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></label>
        <label>Issue<select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}><option value="NO_INTERNET">No internet</option><option value="SLOW_SPEED">Slow speed</option><option value="ROUTER_ISSUE">Router issue</option><option value="FIBER_CUT">Fiber cut</option><option value="NEW_INSTALL">New installation</option><option value="RELOCATION">Relocation</option><option value="BILLING">Billing</option><option value="OTHER">Other</option></select></label>
        <label>Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button className="primary">Submit request</button>
      </form> : <form onSubmit={track} className="portal-form">
        <label>Phone number<input required value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <button className="primary">Find my requests</button>
        {tickets && <div className="portal-results">{tickets.length === 0 ? <p>No requests found for this phone number.</p> : tickets.map((ticket) => <article key={ticket.id}><strong>Ticket #{ticket.id}</strong><span>{ticket.status} · {ticket.priority}</span><p>{ticket.description}</p></article>)}</div>}
      </form>}
    </div>
  </main>
}
