'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeChat, sendMessage } from '@/lib/tripService'
import type { ChatMessage, Trip } from '@/types/trip'

interface Props {
  trip: Trip
  currentUserId: string
  currentUserName: string
  currentUserPhoto?: string
}

export default function GroupChat({ trip, currentUserId, currentUserName, currentUserPhoto }: Props) {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = subscribeChat(trip.id, setMessages)
    return unsub
  }, [trip.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      await sendMessage(trip.id, {
        tripId: trip.id,
        userId: currentUserId,
        displayName: currentUserName,
        photoURL: currentUserPhoto,
        text,
        type: 'message',
      })
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString())     return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupedMessages: Array<{ date: string; messages: ChatMessage[] }> = []
  messages.forEach(msg => {
    const date = formatDate(msg.createdAt)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      groupedMessages.push({ date, messages: [msg] })
    }
  })

  // Avatar initials
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']
  const getColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm font-medium text-gray-900">Group chat</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to say something!</p>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-400 font-medium">{group.date}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2">
              {group.messages.map((msg, i) => {
                const isMe     = msg.userId === currentUserId
                const isSystem = msg.type === 'system'
                const isGladys = msg.type === 'gladys'
                const prevMsg  = group.messages[i - 1]
                const showAvatar = !isMe && !isSystem && msg.userId !== prevMsg?.userId

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-[11px] text-gray-400 bg-gray-50 rounded-full px-3 py-1">
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                if (isGladys) {
                  return (
                    <div key={msg.id} className="flex items-start gap-2 max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        G
                      </div>
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
                        {msg.text}
                        {msg.metadata?.affiliateUrl && (
                          <a href={msg.metadata.affiliateUrl} target="_blank" rel="noopener noreferrer"
                            className="block mt-2 text-xs text-white/60 underline">
                            View details →
                          </a>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <div className="flex-shrink-0 w-6 mb-0.5">
                        {showAvatar && (
                          msg.photoURL ? (
                            <img src={msg.photoURL} className="w-6 h-6 rounded-full object-cover" alt="" />
                          ) : (
                            <div className={`w-6 h-6 rounded-full ${getColor(msg.displayName)} flex items-center justify-center text-white text-[9px] font-bold`}>
                              {getInitials(msg.displayName)}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                      {showAvatar && (
                        <p className="text-[10px] text-gray-400 mb-1 px-1">{msg.displayName}</p>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <p className="text-[9px] text-gray-300 mt-1 px-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message the group..."
            disabled={sending}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none disabled:opacity-50 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition-all active:scale-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}