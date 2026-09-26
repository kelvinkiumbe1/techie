import React from 'react'
import Dashboard from './components/Dashboard.jsx'
import Login from './components/Login.jsx'
import { setToken } from './api.js'
import { useEffect, useState } from 'react'

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('isp_user') || 'null'))
  const [installEvent, setInstallEvent] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  useEffect(() => {
    const onInstallAvailable = (event) => {
      event.preventDefault()
      setInstallEvent(event)
      if (localStorage.getItem('isp_install_dismissed') !== 'true') setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onInstallAvailable)
    window.addEventListener('appinstalled', () => setShowInstall(false))
    return () => window.removeEventListener('beforeinstallprompt', onInstallAvailable)
  }, [])
  function login(result) { localStorage.setItem('isp_user', JSON.stringify(result)); setUser(result) }
  async function install() {
    if (!installEvent) return
    installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setShowInstall(false)
  }
  function dismissInstall() {
    localStorage.setItem('isp_install_dismissed', 'true')
    setShowInstall(false)
  }
  const content = !user
    ? <Login onLogin={login} />
    : <Dashboard user={user} onLogout={() => { setToken(null); localStorage.removeItem('isp_user'); setUser(null) }} />
  return <>
    {content}
    {showInstall && <aside className="install-prompt" role="dialog" aria-label="Install Techie Tracker">
      <div className="install-icon">TT</div>
      <div className="install-copy"><strong>Install Techie Tracker</strong><span>Keep your team dashboard one tap away on your phone.</span></div>
      <button className="install-now" onClick={install}>Install</button>
      <button className="install-dismiss" aria-label="Dismiss install prompt" onClick={dismissInstall}>×</button>
    </aside>}
  </>
}
