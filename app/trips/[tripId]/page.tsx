'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { getTrip, getTripMembers } from '@/lib/tripService'
import TripDashboard from '@/components/GroupTravel/TripDashboard'
import GladysCompanion from '@/components/GladysCompanion'
import type { Trip } from '@/types/trip'

export default function TripPage() {
  const params   = useParams()
  const router   = useRouter()
  const [user]   = useAuthState(auth)
  const [trip,   setTrip]    = useState<Trip | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  const tripId = params?.tripId as string

  useEffect(() => {
    if (!tripId) return
    const load = async () => {
      try {
        const [tripData, members] = await Promise.all([
          getTrip(tripId),
          getTripMembers(tripId),
        ])
        if (!tripData) { router.push('/trips'); return }

        // Check user is a member
        if (user && members.find(m => m.id === user.uid)) {
          setTrip(tripData)
          setAllowed(true)
        } else if (!user) {
          // Not signed in — redirect to sign in with return URL
          router.push(`/auth?redirect=/trips/${tripId}`)
        } else {
          // Signed in but not a member
          router.push(`/trips/join?code=${tripData.inviteCode}`)
        }
      } catch {
        router.push('/trips')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading trip...</p>
        </div>
      </div>
    )
  }

  if (!trip || !allowed || !user) return null

  const gladysContext = `Group trip to ${trip.destinationCity} for ${trip.eventName ?? 'an event'} from ${trip.startDate} to ${trip.endDate}`

  return (
    <div className="min-h-screen bg-gray-50">
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