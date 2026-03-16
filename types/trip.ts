// types/trip.ts

export type TripStatus = 'planning' | 'confirmed' | 'active' | 'completed'
export type MemberRole = 'owner' | 'admin' | 'member'
export type CostCategory = 'flights' | 'hotels' | 'transport' | 'food' | 'tickets' | 'other'
export type SplitMethod = 'equal' | 'custom' | 'percentage'

// ─── Core Trip ────────────────────────────────────────────────────────────────

export interface Trip {
  id: string
  name: string
  destination: string
  destinationCity: string
  destinationCountry: string
  eventName?: string
  eventId?: string
  startDate: string      // ISO date
  endDate: string
  status: TripStatus
  coverImage?: string
  inviteCode: string     // 6-char code for joining
  ownerId: string
  memberCount: number
  totalBudget?: number
  currency: string
  createdAt: string
  updatedAt: string
}

// ─── Members ─────────────────────────────────────────────────────────────────

export interface TripMember {
  id: string             // userId
  tripId: string
  displayName: string
  email: string
  photoURL?: string
  role: MemberRole
  joinedAt: string
  flightNumber?: string
  arrivalTime?: string
  departureTime?: string
  hotelName?: string
  paid: number           // total amount paid for group costs
  owes: number           // net balance (negative = owed money)
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

export interface ItineraryDay {
  id: string
  tripId: string
  date: string           // ISO date
  dayNumber: number
  title?: string
  stops: ItineraryStop[]
}

export interface ItineraryStop {
  id: string
  time: string           // HH:MM
  title: string
  description?: string
  location?: string
  lat?: number
  lon?: number
  type: 'event' | 'hotel' | 'restaurant' | 'transport' | 'activity' | 'free'
  affiliateUrl?: string
  price?: number
  addedBy: string        // userId
  confirmed: boolean
}

// ─── Costs ────────────────────────────────────────────────────────────────────

export interface TripCost {
  id: string
  tripId: string
  title: string
  amount: number
  currency: string
  category: CostCategory
  paidBy: string         // userId
  paidByName: string
  splitMethod: SplitMethod
  splitBetween: string[] // userIds
  customSplits?: Record<string, number> // userId → amount
  date: string
  receiptUrl?: string
  createdAt: string
}

export interface CostSummary {
  memberId: string
  memberName: string
  totalPaid: number
  totalOwes: number
  netBalance: number     // positive = owed money, negative = owes money
  settlements: Settlement[]
}

export interface Settlement {
  from: string           // userId
  fromName: string
  to: string             // userId
  toName: string
  amount: number
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  tripId: string
  userId: string
  displayName: string
  photoURL?: string
  text: string
  type: 'message' | 'system' | 'gladys'
  metadata?: {
    toolType?: string    // 'weather' | 'flights' | etc
    affiliateUrl?: string
  }
  createdAt: string
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export interface TripInvite {
  tripId: string
  tripName: string
  destination: string
  startDate: string
  endDate: string
  memberCount: number
  inviteCode: string
  invitedBy: string
}