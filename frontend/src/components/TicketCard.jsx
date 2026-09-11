import React, { useState } from 'react'

const ISSUE_LABELS = {
  NO_INTERNET: 'No internet',
  SLOW_SPEED: 'Slow speed',
  BILLING: 'Billing',
  ROUTER_ISSUE: 'Router issue',
  FIBER_CUT: 'Fiber cut',
  NEW_INSTALL: 'New install',
  RELOCATION: 'Relocation',
  OTHER: 'Other',
}

const CHANNEL_LABELS = {
  CALL: 'Call',
  WHATSAPP: 'WhatsApp',
  SOCIAL: 'Social',
  WALK_IN: 'Walk-in',
}

function formatElapsed(minutes) {
  if (minutes < 60) return `${minutes}m open`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m open`
}

export default function TicketCard({ ticket, technicians, onAssign, onStatusChange, isAdmin, onCollaborate, onStartWork, onStopWork, onFieldUpdate }) {
  const [selectedTech, setSelectedTech] = useState('')

  const eligibleTechs = technicians.filter((t) => t.team.category === ticket.category)

  return (
    <li className={`ticket-row${ticket.escalated ? ' is-escalated' : ''}`}>
      <div className="ticket-row-top">
        <span className="ticket-customer">{ticket.customerName}</span>
        <span className="ticket-elapsed">{formatElapsed(ticket.minutesOpen)}</span>
      </div>

      <div className="ticket-meta">
        <span className={`pill pill-priority-${ticket.priority.toLowerCase()}`}>
          {ticket.priority === 'URGENT' ? 'Urgent' : ticket.priority === 'NORMAL' ? 'Normal' : 'Low'}
        </span>
        <span className="pill pill-status">{ticket.status.replace('_', ' ')}</span>
        <span>{ISSUE_LABELS[ticket.issueType] || ticket.issueType}</span>
        <span>· {CHANNEL_LABELS[ticket.channel] || ticket.channel}</span>
        {ticket.assignedTechnicianName && <span>· {ticket.assignedTechnicianName}</span>}
        {ticket.workDurationMinutes != null && <span>· {ticket.workDurationMinutes}m worked</span>}
        {ticket.workStartedAt && !ticket.workEndedAt && <span>· timer running</span>}
      </div>

      {ticket.description && <div className="ticket-meta">{ticket.description}</div>}

      <div className="ticket-actions">
        <button onClick={() => onCollaborate(ticket)}>{ticket.assignedTechnicianName ? 'Message / call technician' : 'Open ticket chat'}</button>
        {isAdmin && !['RESOLVED', 'CANCELLED'].includes(ticket.status) && (
          <>
            <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
              <option value="">Assign to…</option>
              {eligibleTechs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              className="primary"
              disabled={!selectedTech}
              onClick={() => onAssign(ticket.id, Number(selectedTech))}
            >
              {ticket.assignedTechnicianName ? 'Reassign' : 'Assign'}
            </button>
          </>
        )}

        {isAdmin && !['RESOLVED', 'CANCELLED'].includes(ticket.status) && (
          <button onClick={() => onStatusChange(ticket.id, 'CANCELLED')}>Cancel task</button>
        )}

        {ticket.status === 'ASSIGNED' && (
          <button className="primary" onClick={() => onStartWork(ticket.id)}>Start work</button>
        )}

        {ticket.status === 'IN_PROGRESS' && (
          <>
            {!ticket.workEndedAt && <button onClick={() => onStopWork(ticket.id)}>Stop timer</button>}
            <button onClick={() => onStatusChange(ticket.id, 'RESOLVED')}>Mark resolved</button>
          </>
        )}
        {!isAdmin && ticket.assignedTechnicianId && (
          <button onClick={() => onFieldUpdate(ticket)}>Add field update</button>
        )}
      </div>
    </li>
  )
}
