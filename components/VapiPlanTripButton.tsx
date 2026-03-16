'use client'

import { useVapiContext } from './VapiProvider'

interface VapiPlanTripButtonProps {
  eventName?: string
  eventCity?: string
  eventDate?: string
  className?: string
}

export function VapiPlanTripButton({
  eventName,
  eventCity,
  eventDate,
  className = '',
}: VapiPlanTripButtonProps) {
  const { status, startCall, endCall } = useVapiContext()
  const isActive = status === 'active'
  const isConnecting = status === 'connecting'
  const isBusy = isConnecting || status === 'ending'

  const context = [eventName, eventCity, eventDate].filter(Boolean).join(' on ')

  const handleClick = () => {
    if (isActive) {
      endCall()
    } else {
      const ctx = context ? `The user is viewing: ${context}. Start by asking if they need help planning the full trip.` : undefined
      startCall(ctx)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
        isActive
          ? 'bg-red-500 text-white hover:bg-red-600'
          : isBusy
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-black text-white hover:bg-gray-800'
      } ${className}`}
    >
      {isBusy ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </>
      ) : isActive ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          End Call
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Plan Trip with Gladys
        </>
      )}
    </button>
  )
}