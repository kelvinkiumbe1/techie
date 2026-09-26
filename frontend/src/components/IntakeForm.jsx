import React, { useState } from 'react'

const ISSUE_OPTIONS = [
  { value: 'NO_INTERNET', label: 'No internet (support)' },
  { value: 'SLOW_SPEED', label: 'Slow speed (support)' },
  { value: 'ROUTER_ISSUE', label: 'Router issue (support)' },
  { value: 'BILLING', label: 'Billing question (support)' },
  { value: 'FIBER_CUT', label: 'Fiber cut / signal loss (fiber & install)' },
  { value: 'NEW_INSTALL', label: 'New installation (fiber & install)' },
  { value: 'RELOCATION', label: 'Relocation (fiber & install)' },
  { value: 'OTHER', label: 'Other' },
]

const CHANNEL_OPTIONS = ['CALL', 'WHATSAPP', 'SOCIAL', 'WALK_IN']

export default function IntakeForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerLocation: '',
    channel: 'CALL',
    issueType: 'NO_INTERNET',
    description: '',
    createdBy: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Customer name and phone are required.')
      return
    }
    setSubmitting(true)
    try {
      await onCreated(form)
    } catch (err) {
      setError(err.message || 'Could not log this request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <h2>Log a request</h2>
        <p className="drawer-sub">Takes under a minute. Category and priority are set automatically.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Customer name</label>
            <input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} />
          </div>

          <div className="field">
            <label>Phone number</label>
            <input value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} />
          </div>

          <div className="field">
            <label>Location (optional)</label>
            <input value={form.customerLocation} onChange={(e) => update('customerLocation', e.target.value)} />
          </div>

          <div className="field">
            <label>How did this come in?</label>
            <select value={form.channel} onChange={(e) => update('channel', e.target.value)}>
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.replace('_', '-')}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Issue type</label>
            <select value={form.issueType} onChange={(e) => update('issueType', e.target.value)}>
              {ISSUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="field-hint">This decides which team's queue it lands in.</div>
          </div>

          <div className="field">
            <label>Notes (optional)</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>

          <div className="field">
            <label>Logged by (optional)</label>
            <input value={form.createdBy} onChange={(e) => update('createdBy', e.target.value)} placeholder="Your name" />
          </div>

          <div className="drawer-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Logging…' : 'Log request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
