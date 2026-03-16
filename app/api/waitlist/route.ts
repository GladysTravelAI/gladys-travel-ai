// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json()

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Check for duplicate
    const q    = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase().trim()))
    const snap = await getDocs(q)

    if (!snap.empty) {
      // Already on list — return success silently
      return NextResponse.json({ success: true, message: 'Already on waitlist' })
    }

    // Save to Firestore
    await addDoc(collection(db, 'waitlist'), {
      email:     email.toLowerCase().trim(),
      name:      name?.trim() || '',
      source:    source || 'general',
      createdAt: serverTimestamp(),
      // Capture useful metadata
      referrer:  req.headers.get('referer') || '',
    })

    return NextResponse.json({ success: true, message: 'Added to waitlist' })
  } catch (err: any) {
    console.error('[waitlist] error:', err)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}