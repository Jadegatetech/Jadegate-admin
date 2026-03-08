import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { getSessions, getMessages, uploadImage, closeSession, reopenSession } from '../api/chat'
import { useAuth } from '../context/AuthContext'

const SOCKET_URL = 'https://jadegate-backend.onrender.com'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString()
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Chat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('open')
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const socketRef = useRef(null)
  const activeSessionRef = useRef(null)

  // Keep ref in sync so socket handlers always have latest session
  useEffect(() => { activeSessionRef.current = activeSession }, [activeSession])

  // — Socket setup (once on mount) —
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const socket = io(SOCKET_URL, { auth: { token } })
    socketRef.current = socket

    socket.on('new_message', (message) => {
      const sid = message.sessionId ?? message.session
      if (sid === activeSessionRef.current?._id) {
        setMessages((prev) => {
          // avoid duplicates
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
        // mark read immediately
        socket.emit('mark_read', {
          sessionId: sid,
          messageId: message._id,
        })
      }
      // refresh session list to update unread counts + lastMessageAt
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
    })

    socket.on('message_read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true } : m))
      )
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [queryClient])

  // — Fetch sessions —
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions', statusFilter],
    queryFn: () => getSessions({ status: statusFilter, page: 1, limit: 50 }),
    select: (res) => res.data?.data ?? [],
    refetchInterval: 30_000,
  })

  // Total unread for sidebar badge (exposed via query cache)
  const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount ?? 0), 0)

  // — Open a session —
  const openSession = async (session) => {
    setActiveSession(session)
    setMessages([])
    setMessagesLoading(true)
    try {
      const { data } = await getMessages(session._id)
      const msgs = data.data ?? []
      setMessages(msgs)
      // join socket room
      socketRef.current?.emit('join_chat', session._id)
      // mark all unread as read
      msgs.filter((m) => !m.isRead).forEach((m) => {
        socketRef.current?.emit('mark_read', {
          sessionId: session._id,
          messageId: m._id,
        })
      })
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  // — Auto-scroll —
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // — Send message —
  const handleSend = () => {
    if (!text.trim() && !imageUrl) return
    const socket = socketRef.current
    if (!socket?.connected) {
      toast.error('Not connected to server')
      return
    }
    socket.emit('send_message', {
      sessionId: activeSession._id,
      text: text.trim() || null,
      imageUrl: imageUrl ?? null,
    })
    setText('')
    setImageUrl(null)
  }

  // — Image upload —
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadImage(file)
      setImageUrl(data.url ?? data.data?.url ?? data.data?.imageUrl)
      toast.success('Image ready')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // — Close / Reopen session —
  const closeMutation = useMutation({
    mutationFn: () => closeSession(activeSession._id),
    onSuccess: () => {
      toast.success('Session closed')
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      setActiveSession((s) => ({ ...s, status: 'closed' }))
    },
    onError: () => toast.error('Failed to close session'),
  })

  const reopenMutation = useMutation({
    mutationFn: () => reopenSession(activeSession._id),
    onSuccess: () => {
      toast.success('Session reopened')
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
      setActiveSession((s) => ({ ...s, status: 'open' }))
    },
    onError: () => toast.error('Failed to reopen session'),
  })

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">

      {/* ── Left panel: inbox ── */}
      <div className="w-80 shrink-0 flex flex-col bg-jade-800 border-r border-jade-700/40">
        {/* Header */}
        <div className="px-4 py-4 border-b border-jade-700/40 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-jade-50">Support Inbox</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <div className="flex gap-1 mt-3">
            {['open', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-jade-400 text-jade-900'
                    : 'text-jade-warm hover:bg-jade-700/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-jade-700/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-jade-700 text-sm py-12 px-4">
              No {statusFilter} sessions
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = activeSession?._id === session._id
              return (
                <button
                  key={session._id}
                  onClick={() => openSession(session)}
                  className={`w-full text-left px-4 py-3 border-b border-jade-700/20 transition-colors ${
                    isActive
                      ? 'bg-jade-400/10 border-l-2 border-l-jade-400'
                      : 'hover:bg-jade-700/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-jade-700/40 flex items-center justify-center shrink-0 text-jade-400 font-semibold text-xs">
                      {initials(session.user?.fullName ?? session.user?.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-medium text-jade-50 truncate">
                          {session.user?.fullName ?? session.user?.username ?? 'Unknown'}
                        </p>
                        {session.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                            {session.unreadCount > 99 ? '99+' : session.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-jade-700 truncate mt-0.5">
                        {session.topic ?? 'Support request'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-jade-700/60 truncate">
                          {session.agent?.fullName ?? session.agent?.username ?? 'Unassigned'}
                        </p>
                        <p className="text-xs text-jade-700/60 shrink-0 ml-2">
                          {formatDate(session.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right panel: conversation ── */}
      {activeSession ? (
        <div className="flex-1 flex flex-col min-w-0 bg-jade-900">
          {/* Conversation header */}
          <div className="px-5 py-3 border-b border-jade-700/40 bg-jade-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-jade-700/40 flex items-center justify-center shrink-0 text-jade-400 font-semibold text-xs">
                {initials(activeSession.user?.fullName ?? activeSession.user?.username)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-jade-50 truncate">
                  {activeSession.user?.fullName ?? activeSession.user?.username ?? 'Unknown'}
                </p>
                <p className="text-xs text-jade-700 truncate">
                  {activeSession.topic ?? 'Support request'}
                  {activeSession.agent && (
                    <span> · {activeSession.agent.fullName ?? activeSession.agent.username}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeSession.status === 'open'
                  ? 'bg-green-400/15 text-green-400'
                  : 'bg-slate-400/15 text-slate-400'
              }`}>
                {activeSession.status}
              </span>
              {activeSession.status === 'open' ? (
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Close ticket
                </button>
              ) : (
                <button
                  onClick={() => reopenMutation.mutate()}
                  disabled={reopenMutation.isPending}
                  className="px-3 py-1.5 bg-jade-400/15 hover:bg-jade-400/20 text-jade-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messagesLoading ? (
              <div className="space-y-3 pt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`h-10 rounded-2xl animate-pulse bg-jade-700/30 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-jade-700 text-sm py-12">No messages yet</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender?._id === user?._id || msg.sender?.role === 'admin'
                return (
                  <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      {!isOwn && (
                        <p className="text-xs text-jade-700 mb-1 ml-1">
                          {msg.sender?.fullName ?? msg.sender?.username ?? 'User'}
                        </p>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? 'bg-jade-400 text-jade-900 rounded-br-sm'
                          : 'bg-jade-800 text-jade-50 rounded-bl-sm'
                      }`}>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="attachment"
                            className="rounded-lg max-w-full mb-2 max-h-48 object-cover cursor-pointer"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                        )}
                        {msg.text && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                      <p className={`text-xs text-jade-700/60 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                        {formatTime(msg.createdAt)}
                        {isOwn && msg.isRead && (
                          <span className="ml-1 text-jade-400">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {activeSession.status === 'open' && (
            <div className="px-4 py-3 border-t border-jade-700/40 bg-jade-800 shrink-0">
              {imageUrl && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-jade-900 rounded-lg">
                  <img src={imageUrl} alt="preview" className="h-10 w-10 object-cover rounded" />
                  <p className="text-xs text-jade-warm flex-1">Image ready to send</p>
                  <button
                    onClick={() => setImageUrl(null)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach image"
                  className="p-2 rounded-lg text-jade-warm hover:text-jade-50 hover:bg-jade-700/20 transition-colors shrink-0"
                >
                  {uploading ? (
                    <span className="w-5 h-5 border-2 border-jade-400/30 border-t-jade-400 rounded-full animate-spin block" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 bg-jade-900 border border-jade-700/40 text-jade-50 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jade-400/50 focus:border-jade-400/50 placeholder-jade-700"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() && !imageUrl}
                  className="p-2.5 bg-jade-400 hover:bg-jade-500 text-jade-900 rounded-xl transition-colors disabled:opacity-40 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center bg-jade-900">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-jade-800 border border-jade-700/40 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-jade-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-jade-50 font-medium">Select a conversation</p>
            <p className="text-jade-700 text-sm mt-1">Choose a session from the inbox to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}
