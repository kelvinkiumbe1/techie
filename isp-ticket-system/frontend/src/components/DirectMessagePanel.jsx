import React, { useEffect, useState, useRef } from 'react'
import { api } from '../api.js'

export default function DirectMessagePanel({ technician, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setCurrentUser(user)
  }, [])

  useEffect(() => {
    const refresh = () => api.getDirectMessages(technician.id).then(setMessages).catch((err) => setError(err.message))
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [technician.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    if (!text.trim() && !selectedMedia) return
    try {
      let mediaUrl = null
      let messageType = 'text'

      if (selectedMedia) {
        const formData = new FormData()
        formData.append('file', selectedMedia)
        const uploadResponse = await api.uploadFile(formData)
        mediaUrl = uploadResponse.url

        if (selectedMedia.type.startsWith('image/')) {
          messageType = 'image'
        } else if (selectedMedia.type.startsWith('video/')) {
          messageType = 'video'
        } else if (selectedMedia.type.startsWith('audio/')) {
          messageType = 'audio'
        }
      }

      const message = await api.sendDirectMessage(technician.id, text || 'Media', messageType, mediaUrl)
      setMessages((current) => [...current, message])
      setText('')
      setSelectedMedia(null)
      setMediaPreview(null)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function startEdit(message) {
    setEditingMessageId(message.id)
    setEditText(message.message)
  }

  async function saveEdit(messageId) {
    if (!editText.trim()) return
    try {
      const updated = await api.editDirectMessage(messageId, editText)
      setMessages((current) => current.map(m => m.id === messageId ? updated : m))
      setEditingMessageId(null)
      setEditText('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return
    try {
      await api.deleteDirectMessage(messageId)
      setMessages((current) => current.filter(m => m.id !== messageId))
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

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    setSelectedMedia(file)

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = (e) => setMediaPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setMediaPreview(file.name)
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

  function isOwnMessage(message) {
    return currentUser && (
      (currentUser.technicianId && message.senderTechnicianId === currentUser.technicianId) ||
      (currentUser.role === 'ADMIN' && !message.senderTechnicianId)
    )
  }

  return <aside className="collaboration-panel">
    <div className="collab-header">
      <div className="direct-chat-title"><span className="direct-contact-avatar">{technician.avatar ? <img src={technician.avatar} alt="" /> : technician.name.slice(0, 1).toUpperCase()}<i className={technician.online ? 'online-dot' : ''} /></span><div><strong>{technician.name}</strong><div className="ticket-meta">{technician.online ? 'Online now' : technician.lastSeen ? `Last seen ${new Date(technician.lastSeen).toLocaleString()}` : 'Offline'} · {technician.team?.category || technician.teamCategory}</div></div></div>
      <button onClick={onClose}>Close</button>
    </div>
    <div className="direct-contact-actions">
      {phone && <><button type="button" onClick={callTechnician}>Phone call</button><a href={`https://wa.me/${phone.replace('+', '')}`} target="_blank" rel="noreferrer">WhatsApp</a></>}
    </div>
    <div className="collab-messages">
      {messages.length === 0 && <div className="queue-empty"><strong>No direct messages yet</strong><span>Start a private conversation with this technician.</span></div>}
      {messages.map((message) => {
        const isOwn = isOwnMessage(message)
        return (
          <div className={`message direct-message ${isOwn ? 'message-own' : 'message-other'}`} key={message.id}>
            <div className="message-header">
              <strong>{message.sender}</strong>
              <span>{new Date(message.createdAt).toLocaleString()}{message.editedAt && ' (edited)'}</span>
            </div>
            {editingMessageId === message.id ? (
              <div className="message-edit-form">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows="2" />
                <div className="message-edit-actions">
                  <button onClick={() => saveEdit(message.id)}>Save</button>
                  <button onClick={() => setEditingMessageId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {message.messageType === 'image' && message.mediaUrl && (
                  <img src={message.mediaUrl} alt="Shared image" className="message-media-image" />
                )}
                {message.messageType === 'video' && message.mediaUrl && (
                  <video src={message.mediaUrl} controls className="message-media-video" />
                )}
                {message.messageType === 'audio' && message.mediaUrl && (
                  <audio src={message.mediaUrl} controls className="message-media-audio" />
                )}
                <p>{message.message}</p>
                {isOwn && (
                  <div className="message-actions">
                    <button onClick={() => startEdit(message)} title="Edit">✎</button>
                    <button onClick={() => deleteMessage(message.id)} title="Delete">🗑</button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
    {error && <small className="error">{error}</small>}
    <form className="message-composer" onSubmit={send}>
      {mediaPreview && (
        <div className="media-preview-container">
          {selectedMedia?.type.startsWith('image/') && (
            <img src={mediaPreview} alt="Preview" className="media-preview" />
          )}
          {selectedMedia?.type.startsWith('video/') && (
            <video src={mediaPreview} className="media-preview" />
          )}
          {selectedMedia?.type.startsWith('audio/') && (
            <div className="audio-preview">{mediaPreview}</div>
          )}
          <button type="button" onClick={() => { setSelectedMedia(null); setMediaPreview(null) }}>✕</button>
        </div>
      )}
      <div className="message-input-wrap">
        <button type="button" className="attachment-btn" onClick={() => fileInputRef.current?.click()} title="Attach media">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"/>
          </svg>
        </button>
        <div style={{position: 'relative', flex: 1}}>
          <textarea rows="1" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${technician.name}…`} />
          {(text.trim() || selectedMedia) && <button className="send-icon" aria-label="Send message" title="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*" style={{ display: 'none' }} />
      </div>
    </form>
  </aside>
}
