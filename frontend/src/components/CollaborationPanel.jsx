import React, { useEffect, useRef, useState } from 'react'
import { api, API_ORIGIN } from '../api.js'

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export default function CollaborationPanel({ ticket, onClose }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [camera, setCamera] = useState(false)
  const [callState, setCallState] = useState('idle')
  const [callError, setCallError] = useState('')
  const cameraStream = useRef(null)
  const callStream = useRef(null)
  const peer = useRef(null)
  const localVideo = useRef(null)
  const remoteVideo = useRef(null)
  const seenSignals = useRef(new Set())

  useEffect(() => {
    api.getMessages(ticket.id).then(setMessages).catch(() => setMessages([]))
    seenSignals.current = new Set()
  }, [ticket.id])

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const events = await api.getSignals(ticket.id)
        if (active) for (const event of events) {
          if (event.id && seenSignals.current.has(event.id)) continue
          if (event.id) seenSignals.current.add(event.id)
          await handleSignal(event.payload)
        }
      } catch (_) { /* polling retries on the next interval */ }
    }
    const timer = setInterval(poll, 1000)
    poll()
    return () => { active = false; clearInterval(timer) }
  }, [ticket.id])

  useEffect(() => () => {
    stopCamera()
    hangUp(false)
  }, [])

  async function send(e) {
    e.preventDefault()
    if (!text.trim() && !file) return
    try {
      const note = await api.sendMessage(ticket.id, text, file)
      setMessages(m => [...m, note]); setText(''); setFile(null); e.target.reset()
    } catch (error) { setCallError(error.message) }
  }

  function stopCamera() {
    const stream = cameraStream.current
    stream?.getTracks().forEach(track => track.stop())
    cameraStream.current = null
    if (localVideo.current?.srcObject === stream) localVideo.current.srcObject = null
    setCamera(false)
  }

  async function postSignal(payload) {
    const event = await api.sendSignal(ticket.id, payload)
    if (event?.id) seenSignals.current.add(event.id)
    return event
  }

  async function capture() {
    if (!camera) {
      if (!navigator.mediaDevices?.getUserMedia) return setCallError('Camera access is not supported by this browser.')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        cameraStream.current = stream
        setCamera(true)
        if (localVideo.current) localVideo.current.srcObject = stream
      } catch (_) { setCallError('Camera permission was denied or is unavailable.') }
      return
    }
    const video = localVideo.current
    if (!video?.videoWidth) return setCallError('Camera is not ready yet.')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))
    if (blob) setFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }))
    stopCamera()
  }

  async function createPeer(initiator) {
    if (peer.current) return peer.current
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Calling is not supported by this browser.')
    const connection = new RTCPeerConnection(rtcConfig)
    peer.current = connection
    connection.onicecandidate = event => {
      if (event.candidate) postSignal({ type: 'candidate', candidate: event.candidate }).catch(() => {})
    }
    connection.ontrack = event => {
      if (remoteVideo.current && event.streams[0]) remoteVideo.current.srcObject = event.streams[0]
    }
    connection.onconnectionstatechange = () => {
      if (['connected', 'connecting'].includes(connection.connectionState)) setCallState('connected')
      if (['failed', 'disconnected', 'closed'].includes(connection.connectionState)) hangUp(false)
    }
    callStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    callStream.current.getTracks().forEach(track => connection.addTrack(track, callStream.current))
    if (localVideo.current) localVideo.current.srcObject = callStream.current
    setCallState(initiator ? 'calling' : 'ringing')
    return connection
  }

  async function startCall() {
    if (peer.current) return
    setCallError('')
    try {
      const connection = await createPeer(true)
      await connection.setLocalDescription(await connection.createOffer())
      await postSignal({ type: 'offer', sdp: connection.localDescription })
    } catch (error) { setCallError(error.message || 'Unable to start call.'); hangUp(false) }
  }

  async function handleSignal(signal) {
    if (!signal?.type) return
    if (signal.type === 'hangup') return hangUp(false)
    try {
      if (signal.type === 'offer') {
        const connection = await createPeer(false)
        if (connection.signalingState === 'have-local-offer') {
          await connection.setLocalDescription({ type: 'rollback' })
        } else if (connection.signalingState !== 'stable') {
          return
        }
        await connection.setRemoteDescription(signal.sdp)
        await connection.setLocalDescription(await connection.createAnswer())
        await postSignal({ type: 'answer', sdp: connection.localDescription })
      } else if (signal.type === 'answer' && peer.current?.signalingState === 'have-local-offer') {
        await peer.current.setRemoteDescription(signal.sdp)
      } else if (signal.type === 'candidate' && peer.current) {
        await peer.current.addIceCandidate(signal.candidate)
      }
    } catch (error) { setCallError(error.message || 'Call negotiation failed.') }
  }

  function hangUp(notify = true) {
    if (notify && peer.current) postSignal({ type: 'hangup' }).catch(() => {})
    callStream.current?.getTracks().forEach(track => track.stop())
    callStream.current = null
    peer.current?.close(); peer.current = null
    if (localVideo.current) localVideo.current.srcObject = null
    if (remoteVideo.current) remoteVideo.current.srcObject = null
    setCallState('idle')
  }
  function handleComposerKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }
  function resizeComposer(e) {
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 140)}px`
    setText(e.target.value)
  }

  return <aside className="collaboration-panel">
    <div className="collab-header"><div><strong>{ticket.assignedTechnicianName ? 'Contact technician' : 'Ticket collaboration'}</strong><div className="ticket-meta">Ticket #{ticket.id} · {ticket.customerName}{ticket.assignedTechnicianName ? ` · ${ticket.assignedTechnicianName}` : ''}</div></div><button onClick={onClose}>Close</button></div>
    <div className="collab-messages">{messages.map(m => <div className="message" key={m.id}><strong>{m.author}</strong><span>{m.createdAt && new Date(m.createdAt).toLocaleString()}</span><p>{m.note}</p>{m.attachmentUrl && <a href={`${API_ORIGIN}${m.attachmentUrl}`} target="_blank" rel="noreferrer">{m.attachmentName || 'Attachment'}</a>}</div>)}</div>
    {callState !== 'idle' && <div className="call-media"><video ref={localVideo} autoPlay muted playsInline /><video ref={remoteVideo} autoPlay playsInline /></div>}
    {camera && <video className="camera-preview" ref={localVideo} autoPlay muted playsInline />}
    {callError && <small className="error">{callError}</small>}
    <form className="message-composer" onSubmit={send}>
      <div className="composer-main">
        <textarea rows="1" value={text} onChange={resizeComposer} onKeyDown={handleComposerKeyDown} placeholder="Write a message…" aria-label="Write a message" />
        <button className="send-icon" disabled={!text.trim() && !file} aria-label="Send message" title="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /><path d="M6 12h16" /></svg>
        </button>
      </div>
      {file && <div className="composer-attachment"><span>Attached</span><strong>{file.name}</strong><button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">×</button></div>}
      <div className="composer-footer">
        <div className="composer-tools">
          <label className="composer-tool" title="Attach a file">＋ Attach<input type="file" accept="image/*,video/*,.pdf,.txt" onChange={e => setFile(e.target.files[0])} /></label>
          <button type="button" className="composer-tool" onClick={capture}>{camera ? 'Capture photo' : 'Camera'}</button>
          {callState === 'idle' ? <button type="button" className="composer-tool" onClick={startCall}>Start call</button> : <button type="button" className="composer-tool danger" onClick={() => hangUp()}>Hang up</button>}
        </div>
        <span>{text.length}/2000 · Enter to send</span>
      </div>
    </form>
  </aside>
}
