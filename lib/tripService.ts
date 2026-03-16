// lib/tripService.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, runTransaction,
  Timestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Trip, TripMember, ItineraryDay, ItineraryStop,
  TripCost, CostSummary, Settlement, ChatMessage, TripInvite,
} from '@/types/trip'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function now(): string {
  return new Date().toISOString()
}

// ─── TRIPS ────────────────────────────────────────────────────────────────────

export async function createTrip(data: {
  name: string
  destination: string
  destinationCity: string
  destinationCountry: string
  startDate: string
  endDate: string
  eventName?: string
  eventId?: string
  currency?: string
  totalBudget?: number
  coverImage?: string
}, userId: string, displayName: string, email: string): Promise<Trip> {
  const inviteCode = generateInviteCode()
  const tripData = {
    ...data,
    currency: data.currency ?? 'USD',
    status: 'planning' as const,
    inviteCode,
    ownerId: userId,
    memberCount: 1,
    createdAt: now(),
    updatedAt: now(),
  }

  const tripRef = await addDoc(collection(db, 'trips'), tripData)
  const tripId = tripRef.id

  // Add owner as first member
  await addDoc(collection(db, 'trips', tripId, 'members'), {
    id: userId,
    tripId,
    displayName,
    email,
    role: 'owner',
    joinedAt: now(),
    paid: 0,
    owes: 0,
  })

  // System message
  await addDoc(collection(db, 'trips', tripId, 'chat'), {
    tripId,
    userId: 'system',
    displayName: 'Gladys Travel',
    text: `${displayName} created the trip to ${data.destination}. Share the invite code **${inviteCode}** with your travel crew!`,
    type: 'system',
    createdAt: now(),
  })

  return { id: tripId, ...tripData }
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const snap = await getDoc(doc(db, 'trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Trip
}

export async function getUserTrips(userId: string): Promise<Trip[]> {
  // Get all trips where user is a member
  const tripsSnap = await getDocs(
    query(collection(db, 'trips'), where('ownerId', '==', userId), orderBy('startDate', 'asc'))
  )

  const owned = tripsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Trip))

  // Also find trips user joined (not owned)
  // We query members subcollections via collectionGroup
  const memberSnap = await getDocs(
    query(collectionGroup_safe(db, 'members'), where('id', '==', userId))
  )

  const joinedTripIds = memberSnap.docs
    .map(d => d.ref.parent.parent?.id)
    .filter((id): id is string => !!id && !owned.find(t => t.id === id))

  const joined = await Promise.all(
    joinedTripIds.map(id => getTrip(id))
  )

  return [...owned, ...joined.filter((t): t is Trip => t !== null)]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

// Safe collectionGroup wrapper
function collectionGroup_safe(db: any, path: string) {
  const { collectionGroup } = require('firebase/firestore')
  return collectionGroup(db, path)
}

export async function updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { ...updates, updatedAt: now() })
}

// Subscribe to trip changes in real-time
export function subscribeTripUpdates(tripId: string, cb: (trip: Trip) => void): () => void {
  return onSnapshot(doc(db, 'trips', tripId), snap => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as Trip)
  })
}

// ─── INVITE / JOIN ────────────────────────────────────────────────────────────

export async function getTripByInviteCode(inviteCode: string): Promise<Trip | null> {
  const snap = await getDocs(
    query(collection(db, 'trips'), where('inviteCode', '==', inviteCode.toUpperCase()))
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Trip
}

export async function joinTrip(tripId: string, userId: string, displayName: string, email: string): Promise<void> {
  // Check not already a member
  const existing = await getDocs(
    query(collection(db, 'trips', tripId, 'members'), where('id', '==', userId))
  )
  if (!existing.empty) return // Already joined

  const batch = writeBatch(db)

  // Add member
  const memberRef = doc(collection(db, 'trips', tripId, 'members'))
  batch.set(memberRef, {
    id: userId,
    tripId,
    displayName,
    email,
    role: 'member',
    joinedAt: now(),
    paid: 0,
    owes: 0,
  })

  // Increment member count
  batch.update(doc(db, 'trips', tripId), {
    memberCount: (await getTrip(tripId))!.memberCount + 1,
    updatedAt: now(),
  })

  await batch.commit()

  // System message
  await addDoc(collection(db, 'trips', tripId, 'chat'), {
    tripId,
    userId: 'system',
    displayName: 'Gladys Travel',
    text: `${displayName} joined the trip! 🎉`,
    type: 'system',
    createdAt: now(),
  })
}

export async function regenerateInviteCode(tripId: string): Promise<string> {
  const newCode = generateInviteCode()
  await updateDoc(doc(db, 'trips', tripId), { inviteCode: newCode, updatedAt: now() })
  return newCode
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'members'), orderBy('joinedAt', 'asc'))
  )
  return snap.docs.map(d => ({ ...d.data() } as TripMember))
}

export function subscribeMembers(tripId: string, cb: (members: TripMember[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'trips', tripId, 'members'), orderBy('joinedAt', 'asc')),
    snap => cb(snap.docs.map(d => ({ ...d.data() } as TripMember)))
  )
}

export async function updateMemberInfo(tripId: string, userId: string, updates: Partial<TripMember>): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'members'), where('id', '==', userId))
  )
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, updates)
  }
}

// ─── COSTS ────────────────────────────────────────────────────────────────────

export async function addCost(tripId: string, cost: Omit<TripCost, 'id' | 'tripId' | 'createdAt'>): Promise<TripCost> {
  const ref = await addDoc(collection(db, 'trips', tripId, 'costs'), {
    ...cost,
    tripId,
    createdAt: now(),
  })

  // Update member paid amount
  await updateMemberBalances(tripId)

  return { id: ref.id, tripId, createdAt: now(), ...cost }
}

export async function getTripCosts(tripId: string): Promise<TripCost[]> {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'costs'), orderBy('date', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TripCost))
}

export function subscribeCosts(tripId: string, cb: (costs: TripCost[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'trips', tripId, 'costs'), orderBy('date', 'desc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as TripCost)))
  )
}

export async function deleteCost(tripId: string, costId: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', tripId, 'costs', costId))
  await updateMemberBalances(tripId)
}

// Calculate who owes what
export async function calculateCostSummary(tripId: string): Promise<CostSummary[]> {
  const [costs, members] = await Promise.all([
    getTripCosts(tripId),
    getTripMembers(tripId),
  ])

  const balances: Record<string, number> = {}
  members.forEach(m => { balances[m.id] = 0 })

  costs.forEach(cost => {
    const splitCount = cost.splitBetween.length
    if (splitCount === 0) return

    // Person who paid gets credit
    balances[cost.paidBy] = (balances[cost.paidBy] ?? 0) + cost.amount

    // Each person in split owes their share
    cost.splitBetween.forEach(userId => {
      let share = 0
      if (cost.splitMethod === 'equal') {
        share = cost.amount / splitCount
      } else if (cost.splitMethod === 'custom' && cost.customSplits) {
        share = cost.customSplits[userId] ?? 0
      } else if (cost.splitMethod === 'percentage' && cost.customSplits) {
        share = (cost.amount * (cost.customSplits[userId] ?? 0)) / 100
      }
      balances[userId] = (balances[userId] ?? 0) - share
    })
  })

  // Compute settlements (simplified debt algorithm)
  const settlements = computeSettlements(balances, members)

  return members.map(m => ({
    memberId: m.id,
    memberName: m.displayName,
    totalPaid: costs.filter(c => c.paidBy === m.id).reduce((s, c) => s + c.amount, 0),
    totalOwes: costs.reduce((s, c) => {
      if (!c.splitBetween.includes(m.id)) return s
      const share = c.splitMethod === 'equal' ? c.amount / c.splitBetween.length : (c.customSplits?.[m.id] ?? 0)
      return s + share
    }, 0),
    netBalance: balances[m.id] ?? 0,
    settlements: settlements.filter(s => s.from === m.id || s.to === m.id),
  }))
}

function computeSettlements(
  balances: Record<string, number>,
  members: TripMember[]
): Settlement[] {
  const settlements: Settlement[] = []
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.displayName]))

  const creditors = Object.entries(balances).filter(([, b]) => b > 0.01).map(([id, b]) => ({ id, balance: b }))
  const debtors   = Object.entries(balances).filter(([, b]) => b < -0.01).map(([id, b]) => ({ id, balance: -b }))

  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const amount = Math.min(c.balance, d.balance)

    settlements.push({
      from: d.id, fromName: memberMap[d.id] ?? d.id,
      to: c.id,   toName:   memberMap[c.id] ?? c.id,
      amount: Math.round(amount * 100) / 100,
    })

    c.balance -= amount
    d.balance -= amount
    if (c.balance < 0.01) ci++
    if (d.balance < 0.01) di++
  }

  return settlements
}

async function updateMemberBalances(tripId: string): Promise<void> {
  const summary = await calculateCostSummary(tripId)
  const members = await getTripMembers(tripId)

  await Promise.all(members.map(async m => {
    const s = summary.find(x => x.memberId === m.id)
    if (!s) return
    await updateMemberInfo(tripId, m.id, {
      paid: Math.round(s.totalPaid * 100) / 100,
      owes: Math.round(Math.max(0, -s.netBalance) * 100) / 100,
    })
  }))
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export async function sendMessage(tripId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'trips', tripId, 'chat'), {
    ...message,
    createdAt: now(),
  })
}

export function subscribeChat(tripId: string, cb: (messages: ChatMessage[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'trips', tripId, 'chat'), orderBy('createdAt', 'asc'), limit(100)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
  )
}

// ─── ITINERARY ────────────────────────────────────────────────────────────────

export async function getTripItinerary(tripId: string): Promise<ItineraryDay[]> {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'itinerary'), orderBy('dayNumber', 'asc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ItineraryDay))
}

export async function upsertItineraryDay(tripId: string, day: Omit<ItineraryDay, 'id'>): Promise<string> {
  // Check if day already exists
  const existing = await getDocs(
    query(collection(db, 'trips', tripId, 'itinerary'), where('date', '==', day.date))
  )
  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, { stops: day.stops, title: day.title })
    return existing.docs[0].id
  }
  const ref = await addDoc(collection(db, 'trips', tripId, 'itinerary'), day)
  return ref.id
}

export function subscribeItinerary(tripId: string, cb: (days: ItineraryDay[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'trips', tripId, 'itinerary'), orderBy('dayNumber', 'asc')),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItineraryDay)))
  )
}