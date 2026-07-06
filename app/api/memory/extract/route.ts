// app/api/memory/extract/route.ts
// 🧠 MEMORY EXTRACTION ENDPOINT
// Called silently after each chat exchange.
// Uses Claude Haiku to extract travel preferences from the conversation.
// Writes to Firestore. Never visible to the user.

import { NextRequest, NextResponse } from 'next/server';
import { getJSONCompletion, MODELS } from '@/lib/anthropic/client';
import {
  getUserMemory,
  updateUserMemory,
  saveTripToHistory,
  incrementSearchCount,
  type GladysUserMemory,
} from '@/lib/memory/gladysMemory';

// ── Extraction prompt ─────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction engine for a travel AI. 
Analyse the conversation and extract any travel preferences or signals about the user.
Return ONLY valid JSON. Never include explanations or markdown.

Extract only what is explicitly or strongly implied. Never infer weakly.

JSON schema:
{
  "name": string | null,
  "homeCity": string | null,
  "homeCityIATA": string | null,
  "passportCountry": string | null,
  "budgetPreference": "budget" | "mid" | "luxury" | null,
  "groupSize": number | null,
  "interests": string[],
  "favoriteSports": string[],
  "favoriteLeagues": string[],
  "favoriteArtists": string[],
  "travelStyle": string[],
  "dietaryNeeds": string[],
  "seatPreference": "window" | "aisle" | null,
  "tripDetected": {
    "eventName": string | null,
    "destination": string | null,
    "country": string | null,
    "eventDate": string | null,
    "eventType": string | null,
    "budgetLevel": string | null
  } | null
}

Rules:
- Only extract what is clearly stated or strongly implied
- interests/sports/leagues: extract from event searches, e.g. "Champions League" → favoriteLeagues: ["Champions League"], interests: ["football"]
- budgetPreference: "budget" if they mention cheap/affordable, "luxury" if premium/first class, "mid" otherwise
- homeCity: if they mention "from Johannesburg", "I'm in Lagos", "flying from Cape Town", etc.
- tripDetected: only if a specific event/destination trip was clearly requested
- Empty arrays [] if nothing detected for that field
- null for scalar fields if not detected`;

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId, messages } = await req.json();

    if (!userId || !messages?.length) {
      return NextResponse.json({ success: false, reason: 'Missing userId or messages' });
    }

    // Only look at last 6 messages for efficiency
    const recentMessages = messages.slice(-6);
    const conversationText = recentMessages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Gladys'}: ${m.content}`)
      .join('\n');

    // Run extraction with Claude Haiku (fast + cheap)
    const extracted = await getJSONCompletion({
      system:      EXTRACTION_SYSTEM_PROMPT,
      user:        `Extract travel preferences from this conversation:\n\n${conversationText}`,
      model:       MODELS.fast,
      maxTokens:   500,
      temperature: 0,
    });

    if (!extracted) {
      return NextResponse.json({ success: false, reason: 'JSON parse failed' });
    }

    // Build memory update — only include fields that have values
    const memoryUpdate: Partial<GladysUserMemory> = {};

    if (extracted.name)             memoryUpdate.name             = extracted.name;
    if (extracted.homeCity)         memoryUpdate.homeCity         = extracted.homeCity;
    if (extracted.homeCityIATA)     memoryUpdate.homeCityIATA     = extracted.homeCityIATA;
    if (extracted.passportCountry)  memoryUpdate.passportCountry  = extracted.passportCountry;
    if (extracted.budgetPreference) memoryUpdate.budgetPreference = extracted.budgetPreference;
    if (extracted.groupSize)        memoryUpdate.groupSize        = extracted.groupSize;
    if (extracted.seatPreference)   memoryUpdate.seatPreference   = extracted.seatPreference;

    // Arrays — only if non-empty
    if (extracted.interests?.length)       memoryUpdate.interests       = extracted.interests;
    if (extracted.favoriteSports?.length)  memoryUpdate.favoriteSports  = extracted.favoriteSports;
    if (extracted.favoriteLeagues?.length) memoryUpdate.favoriteLeagues = extracted.favoriteLeagues;
    if (extracted.favoriteArtists?.length) memoryUpdate.favoriteArtists = extracted.favoriteArtists;
    if (extracted.travelStyle?.length)     memoryUpdate.travelStyle     = extracted.travelStyle;
    if (extracted.dietaryNeeds?.length)    memoryUpdate.dietaryNeeds    = extracted.dietaryNeeds;

    const hasUpdates = Object.keys(memoryUpdate).length > 0;

    // Write memory if anything was extracted
    if (hasUpdates) {
      await updateUserMemory(userId, memoryUpdate);
    }

    // Save trip if a specific trip was detected
    if (extracted.tripDetected?.destination || extracted.tripDetected?.eventName) {
      const t = extracted.tripDetected;
      await saveTripToHistory(userId, {
        eventName:   t.eventName   ?? 'Unknown event',
        destination: t.destination ?? 'Unknown',
        country:     t.country     ?? '',
        eventDate:   t.eventDate   ?? null,
        eventType:   t.eventType   ?? null,
        budgetLevel: t.budgetLevel ?? null,
        plannedAt:   new Date().toISOString(),
        source:      'chat',
      });
      await incrementSearchCount(userId);
    }

    return NextResponse.json({
      success:    true,
      updated:    hasUpdates,
      tripSaved:  !!(extracted.tripDetected?.destination || extracted.tripDetected?.eventName),
      fields:     Object.keys(memoryUpdate),
    });

  } catch (err: any) {
    console.error('[Memory Extract] error:', err);
    // Silent failure — never break the chat experience
    return NextResponse.json({ success: false, reason: err.message });
  }
}