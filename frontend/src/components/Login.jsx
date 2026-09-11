import React, { useState } from 'react'
import { api, setToken } from '../api.js'
export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' }); const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Enter your username and password to continue.')
      return
    }
    try { const result = await api.login(form); setToken(result.token); onLogin(result) }
    catch (err) { setError(err.message.includes('Invalid username') ? 'The username or password is incorrect.' : 'We could not sign you in. Check that the server is running and try again.') }
  }
  return <form className="login-card" onSubmit={submit}>
    <div className="login-mark">TT</div><h2>Welcome back</h2><p>Sign in to manage customer requests.</p>
    <label>Username<input aria-label="Username" autoComplete="username" placeholder="e.g. admin" value={form.username} onChange={e => setForm({...form, username:e.target.value})} /></label>
    <label>Password<input aria-label="Password" autoComplete="current-password" placeholder="Your password" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
    {error && <div className="error-state" role="alert">{error}</div>}<button className="primary">Sign in</button>
  </form>
}
