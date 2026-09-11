import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function DirectMessagePanel({ technician, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.getDirectMessages(technician.id).then(setMessages).catch((err) => setError(err.message))
  }, [technician.id])

  async function send(e) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const message = await api.sendDirectMessage(technician.id, text)
      setMessages((current) => [...current, message])
      setText('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }

  const phone = technician.phone?.replace(/[^\d+]/g, '')
  function callTechnician() {
    if (!phone) return
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phone}`
    } else {
      setError(`Phone calling is available on a mobile device: ${phone}`)
    }
  }
  return <aside className="collaboration-panel">
    <div className="collab-header">
      <div className="direct-chat-title"><span className="direct-contact-avatar">{technician.name.slice(0, 1).toUpperCase()}</span><div><strong>{technician.name}</strong><div className="ticket-meta">{technician.team?.category || technician.teamCategory}</div></div></div>
      <button onClick={onClose}>Close</button>
    </div>
    <div className="direct-contact-actions">
      {phone && <><button type="button" onClick={callTechnician}>Phone call</button><a href={`https://wa.me/${phone.replace('+', '')}`} target="_blank" rel="noreferrer">WhatsApp</a></>}
    </div>
    <div className="collab-messages">
      {messages.length === 0 && <div className="queue-empty"><strong>No direct messages yet</strong><span>Start a private conversation with this technician.</span></div>}
      {messages.map((message) => <div className="message direct-message" key={message.id}><strong>{message.sender}</strong><span>{new Date(message.createdAt).toLocaleString()}</span><p>{message.message}</p></div>)}
    </div>
    {error && <small className="error">{error}</small>}
    <form className="message-composer" onSubmit={send}>
      <textarea rows="2" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${technician.name}…`} />
      <div className="composer-actions"><button className="primary">Send message</button></div>
    </form>
  </aside>
}
