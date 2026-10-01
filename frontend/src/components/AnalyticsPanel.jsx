import React, { useMemo } from 'react'

function percentage(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : '0%'
}

export default function AnalyticsPanel({ tickets, technicians }) {
  const analytics = useMemo(() => {
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED')
    const escalated = tickets.filter((ticket) => ticket.escalated)
    const categories = ['SUPPORT', 'FIBER_INSTALL'].map((category) => ({
      category,
      total: tickets.filter((ticket) => ticket.category === category).length,
      resolved: resolved.filter((ticket) => ticket.category === category).length,
    }))
    const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => ({
      priority,
      total: tickets.filter((ticket) => ticket.priority === priority).length,
    }))
    const leaderboard = technicians.map((technician) => {
      const assigned = tickets.filter((ticket) => ticket.assignedTechnicianId === technician.id)
      const completed = assigned.filter((ticket) => ticket.status === 'RESOLVED').length
      return { ...technician, assigned: assigned.length, completed }
    }).sort((a, b) => b.completed - a.completed || b.assigned - a.assigned)
    return { resolved, escalated, categories, priorities, leaderboard }
  }, [tickets, technicians])

  return (
    <section className="analytics-panel">
      <div className="analytics-header">
        <div><p className="eyebrow">Analytics</p><h2>Service performance</h2><p className="intro-copy">A live summary calculated from the tickets currently visible to you.</p></div>
      </div>
      <div className="analytics-cards">
        <div><span>Total tickets</span><strong>{tickets.length}</strong></div>
        <div><span>Resolved</span><strong>{analytics.resolved.length}</strong><small>{percentage(analytics.resolved.length, tickets.length)} completion rate</small></div>
        <div><span>Escalated</span><strong>{analytics.escalated.length}</strong><small>Needs attention</small></div>
        <div><span>Avg. work time</span><strong>{analytics.resolved.length ? `${Math.round(analytics.resolved.reduce((sum, ticket) => sum + (ticket.workDurationMinutes || 0), 0) / analytics.resolved.length)}m` : '0m'}</strong><small>Resolved tickets</small></div>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card"><h3>By team</h3>{analytics.categories.map((item) => <div className="analytics-row" key={item.category}><span>{item.category === 'FIBER_INSTALL' ? 'Fiber & Installation' : 'Support'}</span><strong>{item.total} <small>{item.resolved} resolved</small></strong></div>)}</div>
        <div className="analytics-card"><h3>By priority</h3>{analytics.priorities.map((item) => <div className="analytics-row" key={item.priority}><span>{item.priority}</span><strong>{item.total}</strong></div>)}</div>
        <div className="analytics-card analytics-leaderboard"><h3>Technician leaderboard</h3>{analytics.leaderboard.length === 0 ? <p className="empty-copy">No technicians available.</p> : analytics.leaderboard.map((technician) => <div className="analytics-row" key={technician.id}><span>{technician.name}</span><strong>{technician.completed} resolved <small>{technician.assigned} assigned</small></strong></div>)}</div>
      </div>
    </section>
  )
}
