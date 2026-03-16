'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending'

export interface AffiliateCard {
  service: string
  displayText: string
  affiliateUrl: string
  message: string
}

// Structured result from any Vapi tool call
export interface ToolResult {
  toolName: string
  result: any
}

export interface VapiState {
  status: CallStatus
  isMuted: boolean
  volumeLevel: number
  transcript: string
  affiliateCards: AffiliateCard[]
  toolResults: ToolResult[]
}

export interface UseVapiReturn extends VapiState {
  startCall: (context?: string) => Promise<void>
  endCall: () => void
  toggleMute: () => void
}

const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!
const PUBLIC_KEY   = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!

export function useVapi(): UseVapiReturn {
  const vapiRef = useRef<Vapi | null>(null)
  const [status,        setStatus]        = useState<CallStatus>('idle')
  const [isMuted,       setIsMuted]       = useState(false)
  const [volumeLevel,   setVolumeLevel]   = useState(0)
  const [transcript,    setTranscript]    = useState('')
  const [affiliateCards, setAffiliateCards] = useState<AffiliateCard[]>([])
  const [toolResults,   setToolResults]   = useState<ToolResult[]>([])

  useEffect(() => {
    if (!PUBLIC_KEY) return
    vapiRef.current = new Vapi(PUBLIC_KEY)
    const vapi = vapiRef.current

    vapi.on('call-start', () => setStatus('active'))
    vapi.on('call-end', () => {
      setStatus('idle')
      setVolumeLevel(0)
      setTranscript('')
    })
    vapi.on('speech-start', () => {})
    vapi.on('speech-end',   () => {})
    vapi.on('volume-level', (level: number) => setVolumeLevel(level))

    vapi.on('message', (msg: any) => {
      // ── Tool call results ───────────────────────────────────
      if (msg.type === 'tool-calls-result') {
        msg.toolCallList?.forEach((call: any) => {
          // Parse result — Vapi returns it as a JSON string
          let result: any = call.result
          if (typeof result === 'string') {
            try { result = JSON.parse(result) } catch { /* keep as string */ }
          }

          const toolName: string = call.function?.name ?? ''

          // Add to toolResults — GladysCompanion watches this for rich cards
          setToolResults(prev => [...prev, { toolName, result }])

          // Legacy: also extract affiliateCards for backward compat
          if (result?.affiliateUrl) {
            setAffiliateCards(prev => [
              ...prev.filter(c => c.service !== result.service),
              {
                service:      result.service      ?? toolName,
                displayText:  result.displayText  ?? '',
                affiliateUrl: result.affiliateUrl,
                message:      result.message      ?? '',
              },
            ])
          }

          // Multiple affiliate cards (e.g. find_nearby_attractions returns affiliateCards[])
          if (Array.isArray(result?.affiliateCards)) {
            setAffiliateCards(prev => {
              const next = [...prev]
              result.affiliateCards.forEach((card: AffiliateCard) => {
                if (!next.find(c => c.service === card.service && c.affiliateUrl === card.affiliateUrl)) {
                  next.push(card)
                }
              })
              return next
            })
          }
        })
      }

      // ── Transcript ─────────────────────────────────────────
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        const speaker = msg.role === 'assistant' ? 'Gladys' : 'You'
        setTranscript(prev =>
          prev ? `${prev}\n${speaker}: ${msg.transcript}` : `${speaker}: ${msg.transcript}`
        )
      }
    })

    vapi.on('error', (err: any) => {
      console.error('[Vapi error]', err)
      setStatus('idle')
    })

    return () => { vapi.stop() }
  }, [])

  const startCall = useCallback(async (context?: string) => {
    if (!vapiRef.current || status !== 'idle') return
    setStatus('connecting')
    setAffiliateCards([])
    setToolResults([])  // Reset tool results on new call
    setTranscript('')
    try {
      await vapiRef.current.start(ASSISTANT_ID, {
        variableValues: context ? { eventContext: context } : undefined,
      })
    } catch (err) {
      console.error('[Vapi startCall]', err)
      setStatus('idle')
    }
  }, [status])

  const endCall = useCallback(() => {
    if (!vapiRef.current) return
    setStatus('ending')
    vapiRef.current.stop()
  }, [])

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return
    const next = !isMuted
    vapiRef.current.setMuted(next)
    setIsMuted(next)
  }, [isMuted])

  return {
    status,
    isMuted,
    volumeLevel,
    transcript,
    affiliateCards,
    toolResults,
    startCall,
    endCall,
    toggleMute,
  }
}