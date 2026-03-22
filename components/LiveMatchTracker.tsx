'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Trophy, Music, RefreshCw, ChevronRight, Users, AlertCircle } from 'lucide-react'

const SKY = '#0EA5E9'
const POLL_INTERVAL = 30_000 // 30 seconds

interface LiveMatchTrackerProps {
  eventType:    'sports' | 'music' | 'festival' | 'other'
  eventName:    string
  eventDate:    string
  fixtureId?:   string   // API-Football fixture ID (for football)
  attraction?:  string   // Artist name (for concerts)
  accentColor?: string
}

export default function LiveMatchTracker({
  eventType, eventName, eventDate, fixtureId, attraction, accentColor,
}: LiveMatchTrackerProps) {
  const accent = accentColor || SKY

  const [expanded, setExpanded]   = useState(false)
  const [data,     setData]       = useState<any>(null)
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')
  const [lastSync, setLastSync]   = useState<Date | null>(null)
  const [tab,      setTab]        = useState<'score' | 'lineup' | 'events' | 'setlist'>('score')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const isFootball = eventType === 'sports' && fixtureId
  const isConcert  = (eventType === 'music' || eventType === 'festival') && attraction

  // Check if event is today or live
  const today      = new Date().toISOString().split('T')[0]
  const isToday    = eventDate === today
  const isRelevant = isToday && (isFootball || isConcert)

  const fetchLiveData = async () => {
    if (!isFootball && !isConcert) return
    setLoading(true)
    try {
      const params = isFootball
        ? `type=football&fixtureId=${fixtureId}`
        : `type=concert&artist=${encodeURIComponent(attraction!)}&date=${eventDate}`

      const res  = await fetch(`/api/live-match?${params}`)
      const json = await res.json()
      setData(json)
      setLastSync(new Date())
      setError('')
    } catch {
      setError('Could not load live data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when expanded + poll every 30s if live
  useEffect(() => {
    if (!expanded || !isRelevant) return
    fetchLiveData()

    // Poll only during live match
    intervalRef.current = setInterval(() => {
      if (data?.status?.isLive) fetchLiveData()
    }, POLL_INTERVAL)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [expanded, isRelevant])

  if (!isFootball && !isConcert) return null

  const isLive    = data?.status?.isLive
  const isEnded   = data?.status?.isEnded

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-slate-100 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '15' }}>
          {isFootball ? <Trophy size={20} style={{ color: accent }} /> : <Music size={20} style={{ color: accent }} />}
          {isLive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-900 text-sm">
              {isFootball ? 'Live Score' : 'Setlist'}
            </p>
            {isLive  && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">LIVE</span>}
            {isEnded && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-400 text-white">FT</span>}
            {isToday && !isLive && !isEnded && !data && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>TODAY</span>}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{eventName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <RefreshCw size={14} className="animate-spin text-slate-400" />}
          <ChevronRight size={16} className={`text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-5 space-y-4">

              {!isRelevant && (
                <div className="text-center py-6">
                  <Radio size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">Live updates available on event day</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Come back on {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} for live {isFootball ? 'scores' : 'setlist'}
                  </p>
                </div>
              )}

              {isRelevant && !data && !loading && (
                <div className="text-center py-6">
                  <button onClick={fetchLiveData}
                    className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-2xl text-white mx-auto transition-opacity hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}>
                    <Radio size={16} />Load Live Data
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 text-red-600 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />{error}
                </div>
              )}

              {/* ── FOOTBALL ── */}
              {data && isFootball && (
                <>
                  {/* Scoreboard */}
                  <div className="rounded-2xl p-5 text-center"
                    style={{ background: isLive ? '#FFF1F2' : '#F8FAFC', border: `2px solid ${isLive ? '#FCA5A5' : '#E2E8F0'}` }}>
                    {data.status?.elapsed && (
                      <p className="text-xs font-black uppercase tracking-wider mb-2"
                        style={{ color: isLive ? '#EF4444' : '#94A3B8' }}>
                        {isLive ? `${data.status.elapsed}'` : data.status.label}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center">
                        {data.teams?.home?.logo && (
                          <img src={data.teams.home.logo} alt={data.teams.home.name} className="w-10 h-10 mx-auto mb-1 object-contain" />
                        )}
                        <p className="font-black text-slate-900 text-sm leading-tight">{data.teams?.home?.name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-black text-slate-900">
                          {data.teams?.home?.score ?? '–'} : {data.teams?.away?.score ?? '–'}
                        </p>
                        {isLive && <p className="text-[10px] text-red-500 font-black animate-pulse mt-1">● LIVE</p>}
                      </div>
                      <div className="flex-1 text-center">
                        {data.teams?.away?.logo && (
                          <img src={data.teams.away.logo} alt={data.teams.away.name} className="w-10 h-10 mx-auto mb-1 object-contain" />
                        )}
                        <p className="font-black text-slate-900 text-sm leading-tight">{data.teams?.away?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {[
                      { id: 'score',  label: '⚡ Events'  },
                      { id: 'lineup', label: '👥 Lineups'  },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTab(t.id as any)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                        style={{ background: tab === t.id ? accent : '#F1F5F9', color: tab === t.id ? 'white' : '#64748B' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Goals & Cards */}
                  {tab === 'score' && (
                    <div className="space-y-2">
                      {(data.goals ?? []).map((g: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200">
                          <span className="text-base">⚽</span>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900">{g.player}</p>
                            <p className="text-[10px] text-slate-400">{g.team} · {g.type}</p>
                          </div>
                          <span className="text-xs font-black text-slate-500">{g.minute}'</span>
                        </div>
                      ))}
                      {(data.cards ?? []).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                          <span className="text-base">{c.type.includes('Red') ? '🟥' : '🟨'}</span>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900">{c.player}</p>
                            <p className="text-[10px] text-slate-400">{c.team}</p>
                          </div>
                          <span className="text-xs font-black text-slate-500">{c.minute}'</span>
                        </div>
                      ))}
                      {(data.substitutions ?? []).map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 border border blue-200">
                          <span className="text-base">🔄</span>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900">↑ {s.playerIn}</p>
                            <p className="text-[10px] text-slate-400">↓ {s.playerOut} · {s.team}</p>
                          </div>
                          <span className="text-xs font-black text-slate-500">{s.minute}'</span>
                        </div>
                      ))}
                      {!data.goals?.length && !data.cards?.length && !data.substitutions?.length && (
                        <p className="text-xs text-slate-400 text-center py-3">No events yet</p>
                      )}
                    </div>
                  )}

                  {/* Lineups */}
                  {tab === 'lineup' && (
                    <div className="grid grid-cols-2 gap-3">
                      {(data.lineups ?? []).map((l: any, i: number) => (
                        <div key={i}>
                          <p className="text-xs font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                            <Users size={11} />{l.team}
                            {l.formation && <span className="text-[10px] text-slate-400 font-semibold">({l.formation})</span>}
                          </p>
                          <div className="space-y-0.5">
                            {(l.startingXI ?? []).map((p: any, j: number) => (
                              <p key={j} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 w-4">{p.number}</span>
                                {p.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      {!data.lineups?.length && (
                        <p className="text-xs text-slate-400 col-span-2 text-center py-3">Lineups not yet announced</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── CONCERT SETLIST ── */}
              {data && isConcert && (
                <div className="space-y-2">
                  {data.tourName && (
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Music size={11} />{data.tourName}
                    </p>
                  )}
                  {data.note && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      {data.note}
                    </p>
                  )}
                  {(data.setlist ?? []).length > 0 && (
                    <div className="space-y-1">
                      {data.setlist.map((song: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          <span className="text-xs font-black text-slate-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                          <p className="text-xs font-semibold text-slate-900">{song}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Last sync */}
              {lastSync && (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-300">
                    Last updated {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button onClick={fetchLiveData}
                    className="flex items-center gap-1 text-[10px] font-bold transition-colors"
                    style={{ color: accent }}>
                    <RefreshCw size={10} />Refresh
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}