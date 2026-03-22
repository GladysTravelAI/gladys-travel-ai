// app/api/push-subscribe/route.ts
// Store Web Push subscriptions and schedule pre-event notifications

import { NextRequest, NextResponse } from 'next/server'

// In production use Firestore — this stores in-memory for simplicity
// You can replace the storage with: import { db } from '@/lib/firebase'
const subscriptions = new Map<string, any>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, userId, eventName, eventDate, venue } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Store subscription keyed by endpoint
    const key = `${userId ?? 'guest'}_${eventDate}`
    subscriptions.set(key, { subscription, userId, eventName, eventDate, venue, createdAt: new Date().toISOString() })

    console.log(`[push-subscribe] Stored subscription for ${eventName} on ${eventDate}`)

    return NextResponse.json({ success: true, message: 'Push subscription saved' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const userId    = searchParams.get('userId') ?? 'guest'
    const eventDate = searchParams.get('eventDate') ?? ''
    const key       = `${userId}_${eventDate}`
    subscriptions.delete(key)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}