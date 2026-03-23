'use client'

import { motion } from 'framer-motion'
import { useVapiContext } from './VapiProvider'

interface VapiPlanTripButtonProps {
  eventName?: string
  eventCity?: string
  eventDate?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VapiPlanTripButton({
  eventName,
  eventCity,
  eventDate,
  className = '',
  size = 'md',
}: VapiPlanTripButtonProps) {
  const { status, startCall, endCall } = useVapiContext()
  const isActive     = status === 'active'
  const isConnecting = status === 'connecting'
  const isBusy       = isConnecting || status === 'ending'

  const context = [eventName, eventCity, eventDate].filter(Boolean).join(' on ')

  const handleClick = () => {
    if (isActive) {
      endCall()
    } else {
      const ctx = context
        ? `The user is viewing: ${context}. Start by asking if they need help planning the full trip.`
        : undefined
      startCall(ctx)
    }
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5',
  }

  const iconSize = { sm: 13, md: 15, lg: 17 }[size]

  return (
    <motion.button
      whileHover={!isBusy ? { scale: 1.02 } : {}}
      whileTap={!isBusy ? { scale: 0.97 } : {}}
      onClick={handleClick}
      disabled={isBusy}
      className={`inline-flex items-center font-bold rounded-full transition-all shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      style={
        isActive
          ? { background: '#EF4444', color: 'white', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }
          : isBusy
          ? { background: '#E2E8F0', color: '#94A3B8', boxShadow: 'none' }
          : { background: 'linear-gradient(135deg, #38BDF8, #0284C7)', color: 'white', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }
      }
    >
      {isBusy ? (
        <>
          <svg
            className="animate-spin"
            width={iconSize} height={iconSize}
            fill="none" viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting…
        </>
      ) : isActive ? (
        <>
          {/* Stop square */}
          <svg width={iconSize} height={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          End Call
        </>
      ) : (
        <>
          {/* Mic icon */}
          <svg width={iconSize} height={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Plan Trip with Gladys
        </>
      )}
    </motion.button>
  )
}