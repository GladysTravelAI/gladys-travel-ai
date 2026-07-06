// lib/memory/gladysMemory.ts
// 🧠 GLADYS MEMORY LAYER
// Persistent user intelligence — preferences, trip history, conversation signals
// Firestore structure:
//   users/{uid}/gladysMemory   → profile + preferences doc
//   users/{uid}/tripHistory    → subcollection of planned/viewed trips

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GladysUserMemory {
  // Who they are
  name:              string | null;
  homeCity:          string | null;
  homeCityIATA:      string | null;
  passportCountry:   string | null;   // e.g. "ZA", "NG", "KE"
  nationality:       string | null;

  // Travel preferences
  budgetPreference:  'budget' | 'mid' | 'luxury' | null;
  travelStyle:       string[];   // e.g. ["solo", "adventure", "cultural"]
  groupSize:         number | null;
  interests:         string[];   // e.g. ["football", "music", "festivals", "F1"]
  dietaryNeeds:      string[];   // e.g. ["halal", "vegetarian"]
  seatPreference:    'window' | 'aisle' | null;

  // Travel intelligence
  upcomingTrips:     string[];   // event names they've searched/planned
  visitedCities:     string[];   // cities from past trips
  favoriteSports:    string[];   // e.g. ["football", "basketball", "F1"]
  favoriteArtists:   string[];   // music artists they've searched
  favoriteLeagues:   string[];   // e.g. ["Premier League", "Champions League"]

  // Engagement signals
  totalSearches:     number;
  lastSeenAt:        string | null;
  firstSeenAt:       string | null;
  updatedAt:         string | null;
}

export interface TripMemory {
  id?:         string;
  eventName:   string;
  destination: string;
  country:     string;
  eventDate:   string | null;
  eventType:   string | null;
  budgetLevel: string | null;
  plannedAt:   string;
  source:      'agent' | 'itinerary' | 'chat';
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_MEMORY: GladysUserMemory = {
  name:             null,
  homeCity:         null,
  homeCityIATA:     null,
  passportCountry:  null,
  nationality:      null,
  budgetPreference: null,
  travelStyle:      [],
  groupSize:        null,
  interests:        [],
  dietaryNeeds:     [],
  seatPreference:   null,
  upcomingTrips:    [],
  visitedCities:    [],
  favoriteSports:   [],
  favoriteArtists:  [],
  favoriteLeagues:  [],
  totalSearches:    0,
  lastSeenAt:       null,
  firstSeenAt:      null,
  updatedAt:        null,
};

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getUserMemory(userId: string): Promise<GladysUserMemory> {
  try {
    const ref  = doc(db, 'users', userId, 'gladysMemory', 'profile');
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ...DEFAULT_MEMORY };
    return { ...DEFAULT_MEMORY, ...snap.data() } as GladysUserMemory;
  } catch (err) {
    console.error('[GladysMemory] read error:', err);
    return { ...DEFAULT_MEMORY };
  }
}

// ── WRITE ─────────────────────────────────────────────────────────────────────

export async function updateUserMemory(
  userId:  string,
  updates: Partial<GladysUserMemory>
): Promise<void> {
  try {
    const ref    = doc(db, 'users', userId, 'gladysMemory', 'profile');
    const snap   = await getDoc(ref);
    const now    = new Date().toISOString();

    if (!snap.exists()) {
      // First time — create full doc
      await setDoc(ref, {
        ...DEFAULT_MEMORY,
        ...updates,
        firstSeenAt: now,
        updatedAt:   now,
      });
    } else {
      // Merge arrays intelligently (no duplicates)
      const existing = snap.data() as GladysUserMemory;
      const merged: Partial<GladysUserMemory> = { ...updates, updatedAt: now };

      const ARRAY_FIELDS: (keyof GladysUserMemory)[] = [
        'interests', 'travelStyle', 'dietaryNeeds',
        'upcomingTrips', 'visitedCities', 'favoriteSports',
        'favoriteArtists', 'favoriteLeagues',
      ];

      for (const field of ARRAY_FIELDS) {
        if (updates[field] && Array.isArray(updates[field])) {
          const existingArr = (existing[field] as string[]) ?? [];
          const newArr      = updates[field] as string[];
          // Merge and deduplicate, cap at 20 items
          merged[field] = [...new Set([...existingArr, ...newArr])].slice(0, 20) as any;
        }
      }

      await updateDoc(ref, merged as any);
    }
  } catch (err) {
    console.error('[GladysMemory] write error:', err);
  }
}

// ── TRIP HISTORY ──────────────────────────────────────────────────────────────

export async function saveTripToHistory(
  userId: string,
  trip:   TripMemory
): Promise<void> {
  try {
    const ref = collection(db, 'users', userId, 'tripHistory');
    await addDoc(ref, { ...trip, plannedAt: new Date().toISOString() });

    // Also update upcomingTrips in profile
    if (trip.eventName) {
      await updateUserMemory(userId, {
        upcomingTrips: [trip.eventName],
        totalSearches: 0, // will be incremented separately
      });
    }
  } catch (err) {
    console.error('[GladysMemory] trip save error:', err);
  }
}

export async function getRecentTrips(
  userId: string,
  count = 5
): Promise<TripMemory[]> {
  try {
    const ref  = collection(db, 'users', userId, 'tripHistory');
    const q    = query(ref, orderBy('plannedAt', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TripMemory));
  } catch {
    return [];
  }
}

// ── INCREMENT SEARCH COUNTER ──────────────────────────────────────────────────

export async function incrementSearchCount(userId: string): Promise<void> {
  try {
    const ref  = doc(db, 'users', userId, 'gladysMemory', 'profile');
    const snap = await getDoc(ref);
    const current = (snap.data()?.totalSearches ?? 0) as number;
    await updateDoc(ref, {
      totalSearches: current + 1,
      lastSeenAt:    new Date().toISOString(),
    });
  } catch { /* silent */ }
}

// ── MEMORY → SYSTEM PROMPT INJECTION ─────────────────────────────────────────
// Converts memory into a compact string injected into Gladys's system prompt.
// Tells Gladys exactly what it knows about this user without being creepy.

export function buildMemoryContext(memory: GladysUserMemory): string {
  if (!memory || (!memory.homeCity && !memory.interests?.length && !memory.budgetPreference)) {
    return ''; // No memory yet — don't inject anything
  }

  const lines: string[] = ['[USER MEMORY — use naturally, never mention this block]:'];

  if (memory.name)            lines.push(`- Name: ${memory.name}`);
  if (memory.homeCity)        lines.push(`- Based in: ${memory.homeCity}${memory.homeCityIATA ? ` (${memory.homeCityIATA})` : ''}`);
  if (memory.passportCountry) lines.push(`- Passport: ${memory.passportCountry} — factor in visa requirements`);
  if (memory.budgetPreference) lines.push(`- Budget preference: ${memory.budgetPreference}`);
  if (memory.groupSize)        lines.push(`- Usually travels in group of: ${memory.groupSize}`);

  if (memory.interests?.length)
    lines.push(`- Interests: ${memory.interests.join(', ')}`);
  if (memory.favoriteSports?.length)
    lines.push(`- Favourite sports: ${memory.favoriteSports.join(', ')}`);
  if (memory.favoriteLeagues?.length)
    lines.push(`- Follows: ${memory.favoriteLeagues.join(', ')}`);
  if (memory.favoriteArtists?.length)
    lines.push(`- Music: ${memory.favoriteArtists.join(', ')}`);
  if (memory.upcomingTrips?.length)
    lines.push(`- Has planned trips to: ${memory.upcomingTrips.slice(0, 3).join(', ')}`);
  if (memory.visitedCities?.length)
    lines.push(`- Has visited: ${memory.visitedCities.slice(0, 5).join(', ')}`);
  if (memory.travelStyle?.length)
    lines.push(`- Travel style: ${memory.travelStyle.join(', ')}`);

  lines.push('Use this to personalise responses — reference their home city for flights, their passport for visa advice, their interests when suggesting events.');

  return lines.join('\n');
}