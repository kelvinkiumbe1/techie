import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import TicketQueue from './TicketQueue.jsx'
import IntakeForm from './IntakeForm.jsx'
import CollaborationPanel from './CollaborationPanel.jsx'

const POLL_MS = 20000

function NavIcon({ name }) {
  const paths = {
    home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
    tickets: <><path d="m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" /><path d="M6 10V8" /><path d="M6 14v1" /><path d="M6 19v2" /><rect x="2" y="8" width="20" height="13" rx="2" /></>,
    staff: <><path d="M17 21a5 5 0 0 0-10 0" /><path d="M22 10.5a3.5 3.5 0 0 0-5.507-2.868" /><path d="M7.507 7.632A3.5 3.5 0 0 0 2 10.5" /><circle cx="12" cy="13" r="3" /><circle cx="18.5" cy="4.5" r="2.5" /><circle cx="5.5" cy="4.5" r="2.5" /></>,
    reports: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14h6" /></>,
    profile: <><path d="m19 16-3 3" /><path d="M2 21a8 8 0 0 1 12.664-6.5" /><path d="M22 19h-6l3 3" /><circle cx="10" cy="8" r="5" /></>,
  }
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function Dashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showIntake, setShowIntake] = useState(false)
  const [workRate, setWorkRate] = useState(null)
  const [collaborationTicket, setCollaborationTicket] = useState(null)
  const [reportFilters, setReportFilters] = useState({ category: '', technicianId: '' })
  const [myTechnician, setMyTechnician] = useState(null)
  const [fieldTicket, setFieldTicket] = useState(null)
  const [fieldNote, setFieldNote] = useState('')
  const [activeView, setActiveView] = useState('overview')
  const [showProfile, setShowProfile] = useState(false)
  const [avatar, setAvatar] = useState(() => localStorage.getItem('isp_avatar') || '')
  const [notifications, setNotifications] = useState(() => localStorage.getItem('isp_notifications') === 'true')
  const [showTechnicianForm, setShowTechnicianForm] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState(null)
  const [openTechnicianMenu, setOpenTechnicianMenu] = useState(null)
  const [technicianForm, setTechnicianForm] = useState({ name: '', phone: '', username: '', password: '', teamCategory: 'SUPPORT' })
  const [technicianError, setTechnicianError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const requests = [
        api.getAllTickets(),
        api.getTechnicians(),
      ]
      if (user.role !== 'ADMIN') requests.push(api.getMyTechnician())
      const results = await Promise.all(requests)
      const ticketData = results[0]
      const techData = results[1]
      setTickets(ticketData)
      setTechnicians(techData)
      if (user.role !== 'ADMIN') setMyTechnician(results[2])
      if (user.role === 'ADMIN') setWorkRate(await api.getWorkRate(reportFilters))
      setError('')
    } catch (err) {
      setError('We could not load the latest requests. Check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [reportFilters, user.role])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
  }, [load])

  async function handleAssign(ticketId, technicianId) {
    await api.assignTicket(ticketId, technicianId)
    load()
  }

  async function handleStatusChange(ticketId, status) {
    await api.updateStatus(ticketId, status)
    load()
  }

  async function handleStartWork(ticketId) { await api.startWork(ticketId); load() }
  async function handleStopWork(ticketId) { await api.stopWork(ticketId); load() }
  async function handleFieldUpdate() {
    if (!fieldTicket || !fieldNote.trim()) return
    await api.fieldUpdate(fieldTicket.id, { note: fieldNote })
    setFieldTicket(null); setFieldNote(''); load()
  }
  async function handleMyStatus(e) { await api.updateMyStatus(e.target.value); load() }
  function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => { const value = String(reader.result); setAvatar(value); localStorage.setItem('isp_avatar', value) }
    reader.readAsDataURL(file)
  }
  async function handleNotifications() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }
    setNotifications((value) => { localStorage.setItem('isp_notifications', String(!value)); return !value })
  }

  async function handleCreate(form) {
    await api.createTicket(form)
    setShowIntake(false)
    load()
  }

  async function handleTechStatus(tech) {
    await api.updateTechnician(tech.id, { status: tech.status === 'OFF' ? 'AVAILABLE' : 'OFF' })
    load()
  }
  function openTechnicianEditor(tech) {
    setOpenTechnicianMenu(null)
    setTechnicianError('')
    setEditingTechnician(tech)
    setTechnicianForm({ name: tech.name, phone: tech.phone || '', username: tech.username || '', password: '', teamCategory: tech.team?.category || tech.teamCategory || 'SUPPORT' })
    setShowTechnicianForm(true)
  }
  async function handleDeleteTechnician(tech) {
    setOpenTechnicianMenu(null)
    if (!window.confirm(`Delete ${tech.name}'s account? Assigned tickets will be unassigned.`)) return
    await api.deleteTechnician(tech.id)
    load()
  }
  async function handleCreateTechnician(e) {
    e.preventDefault()
    setTechnicianError('')
    try {
      if (editingTechnician) {
        await api.updateTechnician(editingTechnician.id, { name: technicianForm.name, phone: technicianForm.phone, teamCategory: technicianForm.teamCategory, username: technicianForm.username })
        if (technicianForm.password) await api.resetTechnicianPassword(editingTechnician.id, technicianForm.password)
      } else {
        await api.createTechnician(technicianForm)
      }
      setTechnicianForm({ name: '', phone: '', username: '', password: '', teamCategory: 'SUPPORT' })
      setEditingTechnician(null)
      setShowTechnicianForm(false)
      load()
    } catch (err) {
      setTechnicianError(err.message || 'Could not create technician account.')
    }
  }

  const visibleTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [ticket.customerName, ticket.description, ticket.issueType, ticket.assignedTechnicianName]
      .filter(Boolean).some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (!statusFilter || ticket.status === statusFilter)
  })
  const supportTickets = visibleTickets.filter((t) => t.category === 'SUPPORT')
  const fiberTickets = visibleTickets.filter((t) => t.category === 'FIBER_INSTALL')
  const escalatedCount = tickets.filter((t) => t.escalated).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="brand-mark">TT</span><div><strong>Techie Tracker</strong><small>Dispatch workspace</small></div></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === 'overview' ? 'active' : ''} onClick={() => setActiveView('overview')}><NavIcon name="home" /> Overview</button>
          <button className={activeView === 'tickets' ? 'active' : ''} onClick={() => setActiveView('tickets')}><NavIcon name="tickets" /> Tickets <b>{tickets.length}</b></button>
          {user.role === 'ADMIN' && <><button className={activeView === 'technicians' ? 'active' : ''} onClick={() => setActiveView('technicians')}><NavIcon name="staff" /> Technicians</button><button className={activeView === 'reports' ? 'active' : ''} onClick={() => setActiveView('reports')}><NavIcon name="reports" /> Reports</button></>}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><span className="user-avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.role === 'ADMIN' ? 'Administrator' : 'Technician'}</small></div><button onClick={onLogout} aria-label="Sign out">↪</button></div>
      </aside>
      <div className="workspace">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="mobile-brand">Techie Tracker</span><span className="view-label">{activeView === 'overview' ? 'Overview' : activeView[0].toUpperCase() + activeView.slice(1)}</span>
        </div>
        <div className="profile-trigger-wrap">
          <button className="profile-trigger" onClick={() => setShowProfile((value) => !value)} aria-label="Open profile and settings">
            {avatar ? <img src={avatar} alt="" /> : <span>{user.username.slice(0, 1).toUpperCase()}</span>}
          </button>
          {showProfile && <section className="profile-menu">
            <div className="profile-menu-heading">
              {avatar ? <img src={avatar} alt="" /> : <span className="profile-large-avatar">{user.username.slice(0, 1).toUpperCase()}</span>}
              <div><strong>{user.username}</strong><small>{user.role === 'ADMIN' ? 'Administrator' : `Technician · ${user.teamCategory}`}</small></div>
            </div>
            <label className="profile-option profile-upload"><span>Profile photo</span><span className="choose-file">Choose file<input type="file" accept="image/*" onChange={handleAvatar} /></span></label>
            <button className="profile-option notification-option" onClick={handleNotifications}><span>Notifications</span><b>{notifications ? 'On' : 'Off'}</b></button>
            <button className="profile-signout" onClick={onLogout}>Sign out</button>
          </section>}
        </div>
        {myTechnician && <label className="tech-status">Status
          <select value={myTechnician.status} onChange={handleMyStatus}>
            <option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="OFF">Off duty</option>
          </select>
        </label>}
        {user.role === 'ADMIN' && <button className="new-ticket-btn" onClick={() => setShowIntake(true)}>
          + Log request
        </button>}
      </div>

      <div className="main-content">
        {activeView === 'overview' && <section className="dashboard-intro">
          <div><p className="eyebrow">{user.role === 'ADMIN' ? 'Operations overview' : 'Your work queue'}</p>
            <h2>{user.role === 'ADMIN' ? 'Keep every request moving' : 'Focus on your assigned work'}</h2>
            <p className="intro-copy">{user.role === 'ADMIN' ? 'Assign, monitor, and support your teams from one place.' : 'Update progress, add field notes, and contact your team from each ticket.'}</p>
          </div>
          <div className="queue-summary"><strong>{tickets.length}</strong><span>active requests</span></div>
        </section>}
        {(activeView === 'overview' || activeView === 'tickets') && <div className="queue-tools" aria-label="Ticket filters">
          <label className="search-field"><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer, issue, technician..." /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="NEW">New</option><option value="ASSIGNED">Assigned</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label>
          {(search || statusFilter) && <button className="clear-filter" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear filters</button>}
        </div>}
        {escalatedCount > 0 && (
          <div className="escalation-banner">
            <span className="escalation-dot" />
            {escalatedCount} request{escalatedCount === 1 ? '' : 's'} waiting too long — check the highlighted rows below.
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading queues…</div>
        ) : error ? (
          <div className="error-state"><strong>We couldn't load the dashboard.</strong><span>{error}</span><button onClick={load}>Try again</button></div>
        ) : (
          <>
          {(activeView === 'overview' || activeView === 'tickets') && <div className="board">
            <TicketQueue
              title="Support"
              category="SUPPORT"
              color="var(--support)"
              tickets={supportTickets}
              technicians={technicians}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              isAdmin={user.role === 'ADMIN'}
              onCollaborate={setCollaborationTicket}
              onStartWork={handleStartWork} onStopWork={handleStopWork} onFieldUpdate={setFieldTicket}
            />
            <TicketQueue
              title="Fiber & Installation"
              category="FIBER_INSTALL"
              color="var(--fiber)"
              tickets={fiberTickets}
              technicians={technicians}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              isAdmin={user.role === 'ADMIN'}
              onCollaborate={setCollaborationTicket}
              onStartWork={handleStartWork} onStopWork={handleStopWork} onFieldUpdate={setFieldTicket}
            />
          </div>}
          </>
        )}
        {workRate && user.role === 'ADMIN' && (activeView === 'overview' || activeView === 'reports' || activeView === 'technicians') && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <h2>{activeView === 'technicians' ? 'Technician management' : 'Operations report'}</h2>
              <div className="report-filters">
                <select value={reportFilters.category} onChange={(e) => setReportFilters({ ...reportFilters, category: e.target.value })}>
                  <option value="">All teams</option><option value="SUPPORT">Support</option><option value="FIBER_INSTALL">Fiber & installation</option>
                </select>
                <select value={reportFilters.technicianId} onChange={(e) => setReportFilters({ ...reportFilters, technicianId: e.target.value })}>
                  <option value="">All technicians</option>
                  {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                </select>
              </div>
            </div>
            {activeView !== 'technicians' && <div className="report-summary">
              <span><strong>{workRate.pendingTickets}</strong> pending</span>
              <span><strong>{workRate.resolvedTickets}</strong> resolved</span>
              <span><strong>{workRate.cancelledTickets}</strong> cancelled</span>
              <span><strong>{workRate.resolutionRate}%</strong> resolution rate</span>
            </div>}
            <div className="technician-list">
              <div className="admin-subheader"><h3>Technician workload</h3>{activeView === 'technicians' && <button className="primary small-button" onClick={() => { setTechnicianError(''); setEditingTechnician(null); setShowTechnicianForm(true) }}>+ Create technician account</button>}</div>
              {(workRate.technicianMetrics || []).map((metric) => {
                const tech = technicians.find((item) => item.id === metric.technicianId)
                return <div className="technician-row" key={metric.technicianId}>
                  <span><strong>{metric.name}</strong> <small>{metric.teamCategory}</small></span>
                  <span>{metric.pendingTickets} pending · {metric.resolvedTickets} resolved · {metric.resolutionRate}% rate</span>
                  {tech && <div className="technician-actions">
                    <button className="technician-menu-trigger" onClick={() => setOpenTechnicianMenu(openTechnicianMenu === tech.id ? null : tech.id)} aria-label={`Actions for ${tech.name}`}>•••</button>
                    {openTechnicianMenu === tech.id && <div className="technician-menu">
                      <button onClick={() => openTechnicianEditor(tech)}>Edit credentials</button>
                      <button onClick={() => { setOpenTechnicianMenu(null); handleTechStatus(tech) }}>{metric.status === 'OFF' ? 'Enable account' : 'Disable account'}</button>
                      <button className="danger-action" onClick={() => handleDeleteTechnician(tech)}>Delete account</button>
                    </div>}
                  </div>}
                </div>
              })}
              </div>
          </section>
        )}
      </div>

      {showIntake && <IntakeForm onClose={() => setShowIntake(false)} onCreated={handleCreate} />}
      {collaborationTicket && <CollaborationPanel ticket={collaborationTicket} onClose={() => setCollaborationTicket(null)} />}
      {fieldTicket && <div className="drawer-backdrop"><section className="drawer">
        <h2>Field update</h2><p className="drawer-sub">{fieldTicket.customerName} · ticket #{fieldTicket.id}</p>
        <div className="field"><label>Work note</label><textarea value={fieldNote} onChange={(e) => setFieldNote(e.target.value)} placeholder="What did you find or change?" autoFocus /></div>
        <div className="drawer-actions"><button onClick={() => { setFieldTicket(null); setFieldNote('') }}>Cancel</button><button className="primary" onClick={handleFieldUpdate} disabled={!fieldNote.trim()}>Save update</button></div>
      </section></div>}
      {showTechnicianForm && <div className="drawer-backdrop"><form className="drawer" onSubmit={handleCreateTechnician}>
        <h2>{editingTechnician ? 'Edit technician account' : 'Create technician account'}</h2><p className="drawer-sub">{editingTechnician ? 'Update profile details or credentials.' : 'Create login details and place the technician on the correct team.'}</p>
        {technicianError && <div className="form-error">{technicianError}</div>}
        <div className="field"><label>Full name<input required value={technicianForm.name} onChange={(e) => setTechnicianForm({ ...technicianForm, name: e.target.value })} placeholder="e.g. Alex Kamau" /></label></div>
        <div className="field"><label>Phone number<input value={technicianForm.phone} onChange={(e) => setTechnicianForm({ ...technicianForm, phone: e.target.value })} placeholder="Optional" /></label></div>
        <div className="field"><label>Username<input required value={technicianForm.username} onChange={(e) => setTechnicianForm({ ...technicianForm, username: e.target.value })} placeholder="Login username" /></label></div>
        <div className="field"><label>{editingTechnician ? 'New password (optional)' : 'Temporary password'}<input required={!editingTechnician} minLength="6" type="password" value={technicianForm.password} onChange={(e) => setTechnicianForm({ ...technicianForm, password: e.target.value })} placeholder={editingTechnician ? 'Leave blank to keep current password' : 'At least 6 characters'} /></label></div>
        <div className="field"><label>Team<select value={technicianForm.teamCategory} onChange={(e) => setTechnicianForm({ ...technicianForm, teamCategory: e.target.value })}><option value="SUPPORT">Support</option><option value="FIBER_INSTALL">Fiber & Installation</option></select></label></div>
        <div className="drawer-actions"><button type="button" onClick={() => { setShowTechnicianForm(false); setEditingTechnician(null) }}>Cancel</button><button className="primary">{editingTechnician ? 'Save changes' : 'Create account'}</button></div>
      </form></div>}
      {user.role === 'ADMIN' && <button className="floating-action" onClick={() => setShowIntake(true)} aria-label="Log new request">+</button>}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={activeView === 'overview' ? 'active' : ''} onClick={() => setActiveView('overview')}><NavIcon name="home" />Home</button>
        <button className={activeView === 'tickets' ? 'active' : ''} onClick={() => setActiveView('tickets')}><NavIcon name="tickets" />Tickets</button>
        {user.role === 'ADMIN' && <button className={activeView === 'technicians' ? 'active' : ''} onClick={() => setActiveView('technicians')}><NavIcon name="staff" />Staff</button>}
        {user.role === 'ADMIN' && <button className={activeView === 'reports' ? 'active' : ''} onClick={() => setActiveView('reports')}><NavIcon name="reports" />Reports</button>}
        <button onClick={() => setShowProfile(true)}><NavIcon name="profile" />Profile</button>
      </nav>
    </div>
    </div>
  )
}
