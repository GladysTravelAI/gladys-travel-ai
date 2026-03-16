'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useVapi, UseVapiReturn } from '@/hooks/useVapi'

const VapiContext = createContext<UseVapiReturn | null>(null)

export function VapiProvider({ children }: { children: ReactNode }) {
  const vapi = useVapi()
  return <VapiContext.Provider value={vapi}>{children}</VapiContext.Provider>
}

export function useVapiContext() {
  const ctx = useContext(VapiContext)
  if (!ctx) throw new Error('useVapiContext must be used within VapiProvider')
  return ctx
}