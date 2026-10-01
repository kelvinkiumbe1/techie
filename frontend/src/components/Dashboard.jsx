import React, { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api.js'
import TicketQueue from './TicketQueue.jsx'
import IntakeForm from './IntakeForm.jsx'
import CollaborationPanel from './CollaborationPanel.jsx'
import DirectMessagePanel from './DirectMessagePanel.jsx'
import AnalyticsPanel from './AnalyticsPanel.jsx'
import { Eye, EyeOff, ImagePlus, LogOut, Trash2 } from 'lucide-react'

const POLL_MS = 20000

function NavIcon({ name }) {
  const paths = {
    home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
    tickets: <><path d="m3.173 8.18 11-5a2 2 0 0 1 2.647.993L18.56 8" /><path d="M6 10V8" /><path d="M6 14v1" /><path d="M6 19v2" /><rect x="2" y="8" width="20" height="13" rx="2" /></>,
    staff: <><path d="M17 21a5 5 0 0 0-10 0" /><path d="M22 10.5a3.5 3.5 0 0 0-5.507-2.868" /><path d="M7.507 7.632A3.5 3.5 0 0 0 2 10.5" /><circle cx="12" cy="13" r="3" /><circle cx="18.5" cy="4.5" r="2.5" /><circle cx="5.5" cy="4.5" r="2.5" /></>,
    reports: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14h6" /></>,
    messages: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
    profile: <><path d="m19 16-3 3" /><path d="M2 21a8 8 0 0 1 12.664-6.5" /><path d="M22 19h-6l3 3" /><circle cx="10" cy="8" r="5" /></>,
  }
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function Dashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [adminAccounts, setAdminAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showIntake, setShowIntake] = useState(false)
  const [workRate, setWorkRate] = useState(null)
  const [collaborationTicket, setCollaborationTicket] = useState(null)
  const [reportFilters, setReportFilters] = useState({ category: '', technicianId: '' })
  const [myTechnician, setMyTechnician] = useState(null)
  const [fieldTicket, setFieldTicket] = useState(null)
  const [fieldNote, setFieldNote] = useState('')
  const [activeView, setActiveView] = useState(() => sessionStorage.getItem('isp_active_view') || 'overview')
  const [showProfile, setShowProfile] = useState(false)
  const [avatar, setAvatar] = useState(() => localStorage.getItem('isp_avatar') || '')
  const [fullscreenImage, setFullscreenImage] = useState('')
  const [showProfileActions, setShowProfileActions] = useState(false)
  const [notifications, setNotifications] = useState(() => localStorage.getItem('isp_notifications') === 'true')
  const [showTechnicianForm, setShowTechnicianForm] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState(null)
  const [openTechnicianMenu, setOpenTechnicianMenu] = useState(null)
  const [directTechnician, setDirectTechnician] = useState(null)
  const [technicianForm, setTechnicianForm] = useState({ name: '', phone: '', username: '', password: '', teamCategory: 'SUPPORT' })
  const [technicianError, setTechnicianError] = useState('')
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminForm, setAdminForm] = useState({ username: '', password: '' })
  const [adminError, setAdminError] = useState('')
  const [showTechnicianPassword, setShowTechnicianPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [quickFilter, setQuickFilter] = useState('')
  const [selectedTickets, setSelectedTickets] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [toast, setToast] = useState(null)
  const loadVersion = useRef(0)
  const previousTickets = useRef(null)

  function notify(message, tone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    sessionStorage.setItem('isp_active_view', activeView)
  }, [activeView])
  useEffect(() => {
    const closeOverlays = (event) => {
      if (event.key !== 'Escape') return
      setShowProfileActions(false)
      setShowIntake(false)
      setShowTechnicianForm(false)
      setShowAdminForm(false)
      setCollaborationTicket(null)
      setDirectTechnician(null)
      setFieldTicket(null)
    }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])
  useEffect(() => {
    api.getProfile().then((profile) => {
      setAvatar(profile.profileImage || '')
      if (profile.profileImage) localStorage.removeItem('isp_avatar')
    }).catch((error) => {
      if (error.status === 401) {
        onLogout()
        return
      }
      setError(error.message || 'Could not load profile.')
    })
  }, [onLogout])
  function navigate(view) {
    setShowProfileActions(false)
    setDirectTechnician(null)
    setCollaborationTicket(null)
    setActiveView(view)
  }

  const load = useCallback(async () => {
    const version = ++loadVersion.current
    try {
      const requests = [
        api.getAllTickets(),
        api.getTechnicians(),
      ]
      if (user.role !== 'ADMIN') requests.push(api.getMyTechnician())
      if (user.role === 'ADMIN') requests.push(api.getWorkRate(reportFilters), api.getAdminAccounts())
      const results = await Promise.all(requests)
      if (version !== loadVersion.current) return
      const ticketData = results[0]
      const techData = results[1]
      setConnectionStatus('connected')
      setTickets(ticketData)
      setTechnicians(techData)
      if (notifications && previousTickets.current) {
        const previous = new Map(previousTickets.current.map((ticket) => [ticket.id, ticket]))
        const changed = ticketData.filter((ticket) => {
          const old = previous.get(ticket.id)
          return old && (old.status !== ticket.status || (!old.escalated && ticket.escalated))
        })
        const added = ticketData.filter((ticket) => !previous.has(ticket.id))
        if (added.length || changed.length) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Techie Tracker update', { body: `${added.length + changed.length} ticket update${added.length + changed.length === 1 ? '' : 's'} require attention.` })
          }
        }
      }
      previousTickets.current = ticketData
      if (user.role !== 'ADMIN') setMyTechnician(results[2])
      if (user.role === 'ADMIN') {
        setWorkRate(results[2])
        setAdminAccounts(results[3])
      }
      setError('')
    } catch (err) {
      if (err.status === 401) {
        onLogout()
        return
      }
      setConnectionStatus('offline')
      setError('We could not load the latest requests. Check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [notifications, reportFilters, user.role])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_MS)
    return () => clearInterval(interval)
  }, [load])

  async function handleAssign(ticketId, technicianId) {
    try {
      await api.assignTicket(ticketId, technicianId)
      notify('Ticket assigned successfully')
      load()
    } catch (error) {
      notify(error.message || 'Could not assign ticket', 'error')
    }
  }

  async function handleStatusChange(ticketId, status) {
    try {
      await api.updateStatus(ticketId, status)
      notify(status === 'RESOLVED' ? 'Ticket marked as resolved' : 'Ticket status updated')
      load()
    } catch (error) {
      notify(error.message || 'Could not update ticket status', 'error')
    }
  }

  async function handleStartWork(ticketId) {
    try { await api.startWork(ticketId); notify('Work timer started'); load() } catch (error) { notify(error.message || 'Could not start work', 'error') }
  }
  async function handleStopWork(ticketId) {
    try { await api.stopWork(ticketId); notify('Work timer stopped'); load() } catch (error) { notify(error.message || 'Could not stop work', 'error') }
  }
  async function handleFieldUpdate() {
    if (!fieldTicket || !fieldNote.trim()) return
    try {
      await api.fieldUpdate(fieldTicket.id, { note: fieldNote })
      setFieldTicket(null); setFieldNote(''); notify('Field update saved'); load()
    } catch (error) {
      notify(error.message || 'Could not save field update', 'error')
    }
  }
  async function handleMyStatus(e) {
    try { await api.updateMyStatus(e.target.value); notify('Availability updated'); load() } catch (error) { notify(error.message || 'Could not update availability', 'error') }
  }
  function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async () => {
      const image = new Image()
      image.onload = async () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        const value = canvas.toDataURL('image/jpeg', 0.82)
        try {
          const profile = await api.updateProfilePhoto(value)
          setAvatar(profile.profileImage); setFullscreenImage(profile.profileImage); localStorage.removeItem('isp_avatar')
        } catch (error) { setError(error.message || 'Could not save profile photo.') }
      }
      image.onerror = () => setError('Could not read the selected profile photo.')
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  function openAvatarPreview(e) {
    e.stopPropagation()
    setShowProfileActions(true)
    if (avatar) setFullscreenImage(avatar)
  }
  function removeAvatar() {
    setAvatar('')
    setFullscreenImage('')
    setShowProfileActions(true)
    api.deleteProfilePhoto().then(() => localStorage.removeItem('isp_avatar')).catch((error) => setError(error.message || 'Could not delete profile photo.'))
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
    try {
      await api.createTicket(form)
      setShowIntake(false)
      notify('Request logged successfully')
      load()
    } catch (error) {
      notify(error.message || 'Could not log the request', 'error')
      throw error
    }
  }
  function toggleSelected(id) {
    setSelectedTickets((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }
  async function bulkUpdate(status) {
    if (!selectedTickets.length) return
    try {
      await api.bulkUpdateTickets({ ticketIds: selectedTickets, status })
      setSelectedTickets([]); notify(`${selectedTickets.length} ticket${selectedTickets.length === 1 ? '' : 's'} updated`); load()
    } catch (error) {
      notify(error.message || 'Could not update selected tickets', 'error')
    }
  }
  async function exportTickets() {
    try {
      const blob = await api.exportTickets()
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a')
      anchor.href = url; anchor.download = 'tickets.csv'; anchor.click(); URL.revokeObjectURL(url)
      notify('CSV export downloaded')
    } catch (error) {
      notify(error.message || 'Could not export tickets', 'error')
    }
  }

  async function handleTechStatus(tech) {
    try {
      await api.updateTechnician(tech.id, { status: tech.status === 'OFF' ? 'AVAILABLE' : 'OFF' })
      notify(tech.status === 'OFF' ? 'Technician enabled' : 'Technician disabled')
      load()
    } catch (error) {
      notify(error.message || 'Could not update technician status', 'error')
    }
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
    try {
      await api.deleteTechnician(tech.id)
      notify('Technician account deleted')
      load()
    } catch (error) {
      notify(error.message || 'Could not delete technician account', 'error')
    }
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
      async function handleCreateAdmin(e) {
        e.preventDefault()
        setAdminError('')
        try {
          await api.createAdminAccount(adminForm)
          setAdminForm({ username: '', password: '' })
          setShowAdminForm(false)
          load()
          notify('Administrator account created')
        } catch (err) {
          setAdminError(err.message || 'Could not create administrator account.')
        }
        async function handleAdminStatus(account) {
          try {
            await api.updateAdminStatus(account.id, !account.enabled)
            notify(account.enabled ? 'Administrator disabled' : 'Administrator enabled')
            load()
          } catch (error) {
            notify(error.message || 'Could not update administrator', 'error')
          }
        }
        async function handleDeleteAdmin(account) {
          if (!window.confirm(`Delete administrator ${account.username}?`)) return
          try {
            await api.deleteAdminAccount(account.id)
            notify('Administrator account deleted')
            load()
          } catch (error) {
            notify(error.message || 'Could not delete administrator', 'error')
          }
        }
      }
      setTechnicianForm({ name: '', phone: '', username: '', password: '', teamCategory: 'SUPPORT' })
      setEditingTechnician(null)
      setShowTechnicianForm(false)
      notify(editingTechnician ? 'Technician account updated' : 'Technician account created')
      load()
    } catch (err) {
      setTechnicianError(err.message || 'Could not create technician account.')
    }
  }

  const visibleTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [ticket.customerName, ticket.description, ticket.issueType, ticket.assignedTechnicianName]
      .filter(Boolean).some((value) => value.toLowerCase().includes(query))
    const matchesQuickFilter = quickFilter === 'urgent'
      ? ticket.escalated || ticket.priority === 'URGENT'
      : quickFilter === 'unassigned'
        ? !ticket.assignedTechnicianId && !['RESOLVED', 'CANCELLED'].includes(ticket.status)
        : quickFilter === 'active'
          ? ticket.status === 'IN_PROGRESS'
          : true
    return matchesSearch && matchesQuickFilter && (!statusFilter || ticket.status === statusFilter) &&
      (!categoryFilter || ticket.category === categoryFilter) &&
      (!priorityFilter || ticket.priority === priorityFilter)
  })
  const sortedTickets = [...visibleTickets].sort((a, b) => {
    if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0)
    if (sortBy === 'priority') {
      const order = { URGENT: 0, HIGH: 1, NORMAL: 2, MEDIUM: 2, LOW: 3 }
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
    }
    if (sortBy === 'wait') return (b.minutesOpen || 0) - (a.minutesOpen || 0)
    return (b.id || 0) - (a.id || 0)
  })
  const supportTickets = sortedTickets.filter((t) => t.category === 'SUPPORT')
  const fiberTickets = sortedTickets.filter((t) => t.category === 'FIBER_INSTALL')
  const escalatedCount = tickets.filter((t) => t.escalated).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><img className="brand-mark" src="/icons/icon.svg" alt="" /><div><strong>Techie Tracker</strong><small>Dispatch workspace</small></div></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button aria-current={activeView === 'overview' ? 'page' : undefined} className={activeView === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><NavIcon name="home" /> Overview</button>
          <button aria-current={activeView === 'tickets' ? 'page' : undefined} className={activeView === 'tickets' ? 'active' : ''} onClick={() => navigate('tickets')}><NavIcon name="tickets" /> Tickets <b>{tickets.length}</b></button>
          <button aria-current={activeView === 'messages' ? 'page' : undefined} className={activeView === 'messages' ? 'active' : ''} onClick={() => navigate('messages')}><NavIcon name="messages" /> Messages</button>
          {user.role === 'ADMIN' && <><button aria-current={activeView === 'technicians' ? 'page' : undefined} className={activeView === 'technicians' ? 'active' : ''} onClick={() => navigate('technicians')}><NavIcon name="staff" /> Technicians</button><button aria-current={activeView === 'reports' ? 'page' : undefined} className={activeView === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><NavIcon name="reports" /> Reports</button></>}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><span className="user-avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.role === 'ADMIN' ? 'Administrator' : 'Technician'}</small></div><button className="sidebar-signout" onClick={onLogout} aria-label="Sign out"><LogOut size={15} aria-hidden="true" /><span>Sign out</span></button></div>
      </aside>
      <div className="workspace">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="mobile-brand">Techie Tracker</span><span className="view-label">{activeView === 'overview' ? 'Overview' : activeView[0].toUpperCase() + activeView.slice(1)}</span>
          <span className={`connection-indicator ${connectionStatus}`}><i />{connectionStatus === 'connected' ? 'Live' : 'Offline'}</span>
        </div>
        <div className="profile-trigger-wrap">
          <button className="profile-trigger" onClick={() => { setShowProfile(false); setShowProfileActions(true); setFullscreenImage(avatar) }} aria-label="Open profile actions">
            {avatar ? <img src={avatar} alt={`${user.username} profile`} /> : <span>{user.username.slice(0, 1).toUpperCase()}</span>}
          </button>
        </div>
        {myTechnician && <label className="tech-status">Status
          <select value={myTechnician.status} onChange={handleMyStatus}>
            <option value="AVAILABLE">Available</option><option value="BUSY">Busy</option><option value="OFF">Off duty</option>
          </select>
        </label>}
        <button className="new-ticket-btn" onClick={() => setShowIntake(true)}>
          + Log request
        </button>
      </div>

      <div className="main-content">
        {activeView === 'overview' && <section className="dashboard-intro">
          <div><p className="eyebrow">{user.role === 'ADMIN' ? 'Operations overview' : 'Your work queue'}</p>
            <h2>{user.role === 'ADMIN' ? 'Keep every request moving' : 'Focus on your assigned work'}</h2>
            <p className="intro-copy">{user.role === 'ADMIN' ? 'Assign, monitor, and support your teams from one place.' : 'Update progress, add field notes, and contact your team from each ticket.'}</p>
          </div>
          <div className="queue-summary"><strong>{tickets.length}</strong><span>active requests</span></div>
        </section>}
        {activeView === 'overview' && <section className="summary-cards" aria-label="Request summary">
          <article><span className="summary-icon blue">◷</span><div><strong>{tickets.filter((ticket) => !['RESOLVED', 'CANCELLED'].includes(ticket.status)).length}</strong><span>Open requests</span></div></article>
          <article><span className="summary-icon red">!</span><div><strong>{tickets.filter((ticket) => ticket.escalated || ticket.priority === 'URGENT').length}</strong><span>Needs attention</span></div></article>
          <article><span className="summary-icon amber">＋</span><div><strong>{tickets.filter((ticket) => !ticket.assignedTechnicianId && !['RESOLVED', 'CANCELLED'].includes(ticket.status)).length}</strong><span>Unassigned</span></div></article>
          <article><span className="summary-icon green">✓</span><div><strong>{tickets.filter((ticket) => ticket.status === 'RESOLVED').length}</strong><span>Resolved</span></div></article>
        </section>}
        {(activeView === 'overview' || activeView === 'tickets') && <div className="queue-tools" aria-label="Ticket filters">
          <label className="search-field"><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer, issue, technician..." /></label>
          <label><span>Quick view</span><select value={quickFilter} onChange={(e) => setQuickFilter(e.target.value)}><option value="">All requests</option><option value="urgent">Needs attention</option><option value="unassigned">Unassigned</option><option value="active">In progress</option></select></label>
          <label><span>Sort by</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Priority</option><option value="wait">Longest waiting</option></select></label>
          <label><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="NEW">New</option><option value="ASSIGNED">Assigned</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label>
        <label><span>Team</span><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All teams</option><option value="SUPPORT">Support</option><option value="FIBER_INSTALL">Fiber</option></select></label>
        <label><span>Priority</span><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="">All priorities</option><option value="URGENT">Urgent</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
        {(search || statusFilter || categoryFilter || priorityFilter || quickFilter) && <button className="clear-filter" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); setQuickFilter('') }}>Clear filters</button>}
        </div>}
        {user.role === 'ADMIN' && selectedTickets.length > 0 && <div className="bulk-actions"><strong>{selectedTickets.length} selected</strong><button onClick={() => bulkUpdate('IN_PROGRESS')}>Mark in progress</button><button onClick={() => bulkUpdate('RESOLVED')}>Resolve</button><button onClick={() => setSelectedTickets([])}>Clear selection</button></div>}
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
              selectedTickets={selectedTickets} onToggleSelected={toggleSelected}
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
              selectedTickets={selectedTickets} onToggleSelected={toggleSelected}
            />
          </div>}
          </>
        )}
        {activeView === 'messages' && <section className="messages-view">
         <div className="messages-view-header"><div><p className="eyebrow">Team communication</p><h2>{user.role === 'ADMIN' ? 'Direct messages' : 'Ticket messages'}</h2><p className="intro-copy">{user.role === 'ADMIN' ? 'Message a technician privately or contact them by phone or WhatsApp.' : 'Open a conversation on one of your assigned tickets.'}</p></div></div>
         <div className="direct-contact-list">
           {(user.role === 'ADMIN' ? technicians : tickets.filter((ticket) => ticket.assignedTechnicianId)).map((item) => user.role === 'ADMIN'
             ? <button className="direct-contact-card" key={item.id} onClick={() => setDirectTechnician(item)}>
               <span className="direct-contact-avatar">{item.name.slice(0, 1).toUpperCase()}</span>
               <span><strong>{item.name}</strong><small>{item.team?.category || item.teamCategory}{item.phone ? ` · ${item.phone}` : ''}</small></span>
               <b>Message</b>
             </button>
             : <button className="direct-contact-card" key={item.id} onClick={() => setCollaborationTicket(item)}>
               <span className="direct-contact-avatar">#</span>
               <span><strong>Ticket #{item.id}</strong><small>{item.customerName} · {item.assignedTechnicianName || 'Assigned team'}</small></span>
               <b>Open chat</b>
             </button>)}
         </div>
        </section>}
        {activeView === 'reports' && <AnalyticsPanel tickets={tickets} technicians={technicians} />}
        {workRate && user.role === 'ADMIN' && (activeView === 'reports' || activeView === 'technicians') && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <h2>{activeView === 'technicians' ? 'Technician management' : 'Operations report'}</h2>
              {activeView === 'reports' && <button className="small-button" onClick={exportTickets}>Export CSV</button>}
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
              <div className="admin-subheader"><div><h3>Technician workload</h3><p>Manage team access, roles, and assignments.</p></div>{activeView === 'technicians' && <div className="account-actions"><button className="small-button" onClick={() => { setAdminError(''); setShowAdminForm(true) }}>Create administrator</button><button className="primary small-button" onClick={() => { setTechnicianError(''); setEditingTechnician(null); setShowTechnicianForm(true) }}>Create technician</button></div>}</div>
              {(workRate.technicianMetrics || []).length === 0 ? (
                <div className="management-empty"><span className="management-empty-icon">＋</span><strong>No technicians yet</strong><p>Create a technician account to start assigning requests to your team.</p><button className="primary small-button" onClick={() => { setTechnicianError(''); setEditingTechnician(null); setShowTechnicianForm(true) }}>Create first technician</button></div>
              ) : (workRate.technicianMetrics || []).map((metric) => {
                const tech = technicians.find((item) => item.id === metric.technicianId)
                return <div className="technician-row" key={metric.technicianId}>
                  <span><strong>{metric.name}</strong> <small>{metric.teamCategory}</small></span>
                  <span>{metric.pendingTickets} pending · {metric.resolvedTickets} resolved · {metric.resolutionRate}% rate</span>
                  {tech && <div className="technician-actions">
                    <button className="technician-menu-trigger" onClick={() => setOpenTechnicianMenu(openTechnicianMenu === tech.id ? null : tech.id)} aria-label={`Actions for ${tech.name}`}>•••</button>
                    {openTechnicianMenu === tech.id && <div className="technician-menu">
                      <button onClick={() => { setOpenTechnicianMenu(null); setDirectTechnician(tech) }}>Message / contact</button>
                      <button onClick={() => openTechnicianEditor(tech)}>Edit credentials</button>
                      <button onClick={() => { setOpenTechnicianMenu(null); handleTechStatus(tech) }}>{metric.status === 'OFF' ? 'Enable account' : 'Disable account'}</button>
                      <button className="danger-action" onClick={() => handleDeleteTechnician(tech)}>Delete account</button>
                    </div>}
                  </div>}
                </div>
              })}
              </div>
              {activeView === 'technicians' && <div className="admin-accounts">
                <div className="admin-subheader"><div><h3>Administrator accounts</h3><p>Manage access without disabling your own account.</p></div></div>
                {adminAccounts.map((account) => <div className="admin-account-row" key={account.id}>
                  <span><strong>{account.username}</strong><small>{account.enabled ? 'Active' : 'Disabled'}</small></span>
                  <div><button className="small-button" disabled={account.username === user.username} onClick={() => handleAdminStatus(account)}>{account.enabled ? 'Disable' : 'Enable'}</button><button className="small-button danger-button" disabled={account.username === user.username} onClick={() => handleDeleteAdmin(account)}>Delete</button></div>
                </div>)}
              </div>}
          </section>
        )}
      </div>

      {showIntake && <IntakeForm onClose={() => setShowIntake(false)} onCreated={handleCreate} />}
      {collaborationTicket && <CollaborationPanel ticket={collaborationTicket} onClose={() => setCollaborationTicket(null)} />}
      {directTechnician && <DirectMessagePanel technician={directTechnician} onClose={() => setDirectTechnician(null)} />}
      {fieldTicket && <div className="drawer-backdrop"><section className="drawer">
        <h2>Field update</h2><p className="drawer-sub">{fieldTicket.customerName} · ticket #{fieldTicket.id}</p>
        <div className="field"><label>Work note</label><textarea value={fieldNote} onChange={(e) => setFieldNote(e.target.value)} placeholder="What did you find or change?" autoFocus /></div>
        <div className="drawer-actions"><button onClick={() => { setFieldTicket(null); setFieldNote('') }}>Cancel</button><button className="primary" onClick={handleFieldUpdate} disabled={!fieldNote.trim()}>Save update</button></div>
      </section></div>}
      {showTechnicianForm && <div className="drawer-backdrop"><form className="drawer account-drawer" onSubmit={handleCreateTechnician}>
        <div className="drawer-heading"><div><p className="eyebrow">Team access</p><h2>{editingTechnician ? 'Edit technician account' : 'Create technician account'}</h2><p className="drawer-sub">{editingTechnician ? 'Update profile details or credentials.' : 'Create login details and place the technician on the correct team.'}</p></div><button type="button" className="drawer-close" aria-label="Close form" onClick={() => { setShowTechnicianForm(false); setEditingTechnician(null) }}>×</button></div>
        {technicianError && <div className="form-error">{technicianError}</div>}
        <div className="account-form"><div className="field"><label>Full name<input required value={technicianForm.name} onChange={(e) => setTechnicianForm({ ...technicianForm, name: e.target.value })} placeholder="e.g. Alex Kamau" /></label></div>
        <div className="field"><label>Phone number <span className="optional-label">Optional</span><input value={technicianForm.phone} onChange={(e) => setTechnicianForm({ ...technicianForm, phone: e.target.value })} placeholder="e.g. 0712 345 678" /></label></div>
        <div className="field"><label>Username<input required value={technicianForm.username} onChange={(e) => setTechnicianForm({ ...technicianForm, username: e.target.value })} placeholder="Login username" /></label></div>
        <div className="field"><label>{editingTechnician ? 'New password' : 'Temporary password'} {editingTechnician && <span className="optional-label">Optional</span>}<span className="password-input"><input required={!editingTechnician} minLength="6" type={showTechnicianPassword ? 'text' : 'password'} value={technicianForm.password} onChange={(e) => setTechnicianForm({ ...technicianForm, password: e.target.value })} placeholder={editingTechnician ? 'Leave blank to keep current password' : 'At least 6 characters'} /><button type="button" onClick={() => setShowTechnicianPassword((value) => !value)} aria-label={showTechnicianPassword ? 'Hide password' : 'Show password'}>{showTechnicianPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label></div>
        <div className="field"><label>Team<select value={technicianForm.teamCategory} onChange={(e) => setTechnicianForm({ ...technicianForm, teamCategory: e.target.value })}><option value="SUPPORT">Support</option><option value="FIBER_INSTALL">Fiber & Installation</option></select></label></div></div>
        <div className="drawer-actions"><button type="button" onClick={() => { setShowTechnicianForm(false); setEditingTechnician(null) }}>Cancel</button><button className="primary">{editingTechnician ? 'Save changes' : 'Create account'}</button></div>
      </form></div>}
      {showAdminForm && <div className="drawer-backdrop"><form className="drawer account-drawer" onSubmit={handleCreateAdmin}>
        <div className="drawer-heading"><div><p className="eyebrow">Secure access</p><h2>Create administrator account</h2><p className="drawer-sub">Create a separate login with access to technician management and reports.</p></div><button type="button" className="drawer-close" aria-label="Close form" onClick={() => setShowAdminForm(false)}>×</button></div>
        {adminError && <div className="form-error">{adminError}</div>}
        <div className="account-form"><div className="field"><label>Username<input required value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} placeholder="Administrator username" /></label></div>
        <div className="field"><label>Password<span className="password-input"><input required minLength="6" type={showAdminPassword ? 'text' : 'password'} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="At least 6 characters" /><button type="button" onClick={() => setShowAdminPassword((value) => !value)} aria-label={showAdminPassword ? 'Hide password' : 'Show password'}>{showAdminPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label><p className="field-hint">Use a unique username and a strong password.</p></div></div>
        <div className="drawer-actions"><button type="button" onClick={() => setShowAdminForm(false)}>Cancel</button><button className="primary">Create administrator</button></div>
      </form></div>}
      {activeView !== 'messages' && <button className="floating-action" onClick={() => setShowIntake(true)} aria-label="Log new request">+</button>}
      {showProfileActions && <div className="avatar-lightbox" role="dialog" aria-modal="true" aria-label="Profile actions" onClick={() => { setShowProfileActions(false); setFullscreenImage('') }}>
        <div className="avatar-lightbox-card" onClick={(e) => e.stopPropagation()}>
          <div className="avatar-lightbox-image-wrap">
            {fullscreenImage ? <img src={fullscreenImage} alt={`${user.username} profile enlarged`} /> : <span className="avatar-lightbox-placeholder">{user.username.slice(0, 1).toUpperCase()}</span>}
          </div>
          <strong>{user.username}</strong><span>{user.role === 'ADMIN' ? 'Administrator' : 'Technician'}</span>
          <div className="avatar-lightbox-actions">
            <label className="avatar-photo-action primary" title="Upload a new profile photo">
              <ImagePlus size={17} aria-hidden="true" /> Change photo
              <input type="file" accept="image/*" onChange={(e) => { handleAvatar(e); setFullscreenImage('') }} />
            </label>
            <button className="avatar-photo-action danger" onClick={removeAvatar}><Trash2 size={17} aria-hidden="true" /> Delete photo</button>
            <button className="avatar-photo-action signout" onClick={onLogout}><LogOut size={17} aria-hidden="true" /> Sign out</button>
          </div>
        </div>
      </div>}
      {toast && <div className={`toast toast-${toast.tone}`} role="status">{toast.message}</div>}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={activeView === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><NavIcon name="home" />Home</button>
        <button className={activeView === 'messages' ? 'active' : ''} onClick={() => navigate('messages')}><NavIcon name="messages" />Messages</button>
        <button className={activeView === 'tickets' ? 'active' : ''} onClick={() => navigate('tickets')}><NavIcon name="tickets" />Tickets</button>
        {user.role === 'ADMIN' && <button className={activeView === 'technicians' ? 'active' : ''} onClick={() => navigate('technicians')}><NavIcon name="staff" />Staff</button>}
        {user.role === 'ADMIN' && <button className={activeView === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><NavIcon name="reports" />Reports</button>}
      </nav>
    </div>
    </div>
  )
}
