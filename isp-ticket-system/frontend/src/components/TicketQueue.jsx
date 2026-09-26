import React from 'react'
import TicketCard from './TicketCard.jsx'

export default function TicketQueue({ title, category, color, tickets, technicians, onAssign, onStatusChange, isAdmin, onCollaborate, onStartWork, onStopWork, onFieldUpdate }) {
  return (
    <div className="queue-column" style={{ '--team-color': color }}>
      <div className="queue-header">
        <h2>{title}</h2>
        <span className="queue-count">{tickets.length} open</span>
      </div>

      {tickets.length === 0 ? (
        <div className="queue-empty"><strong>{tickets.length === 0 ? 'All clear' : 'No matching requests'}</strong><span>{tickets.length === 0 ? 'New requests for this team will appear here.' : 'Try clearing your filters or searching for another request.'}</span></div>
      ) : (
        <ul className="queue-list">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              technicians={technicians}
              onAssign={onAssign}
              onStatusChange={onStatusChange}
              isAdmin={isAdmin}
              onCollaborate={onCollaborate}
              onStartWork={onStartWork}
              onStopWork={onStopWork}
              onFieldUpdate={onFieldUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
