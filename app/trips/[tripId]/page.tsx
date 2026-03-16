'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getTrip, getTripMembers } from '@/lib/tripService'
import TripDashboard from '@/components/GroupTravel/TripDashboard'
import GladysCompanion from '@/components/GladysCompanion'
import type { Trip } from '@/types/trip'

export default function TripPage() {
  const params              = useParams()
  const router              = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [trip,    setTrip]    = useState<Trip | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  const tripId = params?.tripId as string

  useEffect(() => {
    // Wait for auth to resolve before loading trip
    if (authLoading) return
    if (!tripId)     return

    const load = async () => {
      try {
        const [tripData, members] = await Promise.all([
          getTrip(tripId),
          getTripMembers(tripId),
        ])

        if (!tripData) { router.push('/trips'); return }

        if (user && members.find(m => m.id === user.uid)) {
          // Signed in and a member — show the dashboard
          setTrip(tripData)
          setAllowed(true)
        } else if (!user) {
          // Not signed in — redirect to sign in with return URL
          router.push(`/signin?redirect=/trips/${tripId}`)
        } else {
          // Signed in but not a member — send to join flow
          router.push(`/trips/join?code=${tripData.inviteCode}`)
        }
      } catch {
        router.push('/trips')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [tripId, user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-semibold">Loading trip...</p>
        </div>
      </div>
    )
  }

  if (!trip || !allowed || !user) return null

  const gladysContext = `Group trip to ${trip.destinationCity} for ${trip.eventName ?? 'an event'} from ${trip.startDate} to ${trip.endDate}`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-xl">
        <TripDashboard
          trip={trip}
          currentUserId={user.uid}
          currentUserName={user.displayName ?? 'Traveller'}
          currentUserPhoto={user.photoURL ?? undefined}
        />
      </div>

      {/* Gladys knows the trip context */}
      <GladysCompanion eventContext={gladysContext} />
    </div>
  )
}