// lib/core/monetization/affiliateWrapper.ts
// 💰 MONETIZATION TRACKING LAYER

import { BudgetLevel } from '@/lib/core/types/event';

// ==================== CONFIG ====================

const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '500540';
const APP_ID = 'gladystravel';

// ==================== TYPES ====================

export type AffiliatePartner =
  | 'aviasales'
  | 'agoda'
  | 'booking'
  | 'airalo'
  | 'yesim'
  | 'ekta'
  | 'gettransfer'
  | 'airhelp'
  | 'radicalstorage'
  | 'ticketmaster'
  | 'stubhub'
  | 'seatgeek';

export type AffiliateCategory =
  | 'flight'
  | 'hotel'
  | 'esim'
  | 'insurance'
  | 'transfer'
  | 'compensation'
  | 'storage'
  | 'ticket';

export interface AffiliateWrapInput {
  partner: AffiliatePartner;
  category: AffiliateCategory;
  base_url: string;
  event_id: string;
  city: string;
  user_session?: string;
  budget_level?: BudgetLevel;
  extra_params?: Record<string, string>;
}

export interface AffiliateWrapOutput {
  url: string;
  partner: AffiliatePartner;
  category: AffiliateCategory;
  tracking_id: string;
}

export interface ClickMetadata {
  tracking_id: string;
  partner: AffiliatePartner;
  category: AffiliateCategory;
  event_id: string;
  city: string;
  budget_level?: BudgetLevel;
  user_session?: string;
  timestamp: string;
  url: string;
}

// ==================== PARTNER CONFIGS ====================

const PARTNER_PARAM_MAP: Record<AffiliatePartner, string> = {
  aviasales: 'marker',
  agoda: 'tag',
  booking: 'aid',
  airalo: 'marker',
  yesim: 'ref',
  ekta: 'marker',
  gettransfer: 'marker',
  airhelp: 'marker',
  radicalstorage: 'marker',
  ticketmaster: 'tm_link',
  stubhub: 'referrer',
  seatgeek: 'aid',
};

// ==================== CORE WRAPPER ====================

export function wrapAffiliateUrl(input: AffiliateWrapInput): AffiliateWrapOutput {
  const {
    partner,
    category,
    base_url,
    event_id,
    city,
    user_session,
    budget_level,
    extra_params = {},
  } = input;

  // Generate tracking ID for this click
  const tracking_id = generateTrackingId(partner, event_id, city);

  // Build URL with all params
  const url = new URL(base_url);

  // Append affiliate marker
  const markerParam = PARTNER_PARAM_MAP[partner];
  url.searchParams.set(markerParam, MARKER);

  // Append tracking params
  url.searchParams.set('utm_source', APP_ID);
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', event_id);
  url.searchParams.set('utm_content', city.toLowerCase().replace(/\s+/g, '_'));
  url.searchParams.set('ref', tracking_id);

  if (budget_level) {
    url.searchParams.set('utm_term', budget_level);
  }

  // Append any extra params
  Object.entries(extra_params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Log click metadata (fire and forget)
  logClickMetadata({
    tracking_id,
    partner,
    category,
    event_id,
    city,
    budget_level,
    user_session,
    timestamp: new Date().toISOString(),
    url: url.toString(),
  });

  return {
    url: url.toString(),
    partner,
    category,
    tracking_id,
  };
}

// ==================== PARTNER-SPECIFIC BUILDERS ====================

export function buildFlightUrl(params: {
  origin_iata: string;
  dest_iata: string;
  depart_date: string;
  return_date?: string;
  passengers?: number;
  event_id: string;
  city: string;
  budget_level?: BudgetLevel;
  user_session?: string;
}): AffiliateWrapOutput {
  const base = new URL('https://www.aviasales.com/search');
  base.searchParams.set('origin', params.origin_iata);
  base.searchParams.set('destination', params.dest_iata);
  base.searchParams.set('depart_date', params.depart_date);
  if (params.return_date) base.searchParams.set('return_date', params.return_date);
  base.searchParams.set('passengers', String(params.passengers || 1));

  return wrapAffiliateUrl({
    partner: 'aviasales',
    category: 'flight',
    base_url: base.toString(),
    event_id: params.event_id,
    city: params.city,
    budget_level: params.budget_level,
    user_session: params.user_session,
  });
}

export function buildHotelUrl(params: {
  city: string;
  check_in: string;
  check_out: string;
  guests?: number;
  event_id: string;
  budget_level?: BudgetLevel;
  user_session?: string;
}): AffiliateWrapOutput {
  const base = new URL('https://www.agoda.com/search');
  base.searchParams.set('city', params.city);
  base.searchParams.set('checkIn', params.check_in);
  base.searchParams.set('checkOut', params.check_out);
  base.searchParams.set('guests', String(params.guests || 2));

  return wrapAffiliateUrl({
    partner: 'agoda',
    category: 'hotel',
    base_url: base.toString(),
    event_id: params.event_id,
    city: params.city,
    budget_level: params.budget_level,
    user_session: params.user_session,
  });
}

export function buildESimUrl(params: {
  destination_country: string;
  event_id: string;
  city: string;
  user_session?: string;
}): AffiliateWrapOutput {
  const slug = params.destination_country.toLowerCase().replace(/\s+/g, '-');
  return wrapAffiliateUrl({
    partner: 'airalo',
    category: 'esim',
    base_url: `https://www.airalo.com/esim/${slug}`,
    event_id: params.event_id,
    city: params.city,
    user_session: params.user_session,
  });
}

export function buildInsuranceUrl(params: {
  destination: string;
  start_date: string;
  end_date: string;
  event_id: string;
  city: string;
  user_session?: string;
}): AffiliateWrapOutput {
  return wrapAffiliateUrl({
    partner: 'ekta',
    category: 'insurance',
    base_url: 'https://ekta.insure/',
    event_id: params.event_id,
    city: params.city,
    user_session: params.user_session,
    extra_params: {
      destination: params.destination,
      start_date: params.start_date,
      end_date: params.end_date,
    },
  });
}

export function buildTransferUrl(params: {
  from: string;
  to: string;
  date: string;
  event_id: string;
  city: string;
  user_session?: string;
}): AffiliateWrapOutput {
  return wrapAffiliateUrl({
    partner: 'gettransfer',
    category: 'transfer',
    base_url: 'https://www.gettransfer.com/en/',
    event_id: params.event_id,
    city: params.city,
    user_session: params.user_session,
    extra_params: {
      from: params.from,
      to: params.to,
      date: params.date,
    },
  });
}

export function buildAirHelpUrl(params: {
  event_id: string;
  city: string;
  user_session?: string;
}): AffiliateWrapOutput {
  return wrapAffiliateUrl({
    partner: 'airhelp',
    category: 'compensation',
    base_url: 'https://www.airhelp.com/en/check-my-flight/',
    event_id: params.event_id,
    city: params.city,
    user_session: params.user_session,
  });
}

// ==================== TRACKING ====================

function generateTrackingId(partner: string, event_id: string, city: string): string {
  const timestamp = Date.now().toString(36);
  const slug = `${partner}-${event_id}-${city}`.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
  return `${slug}-${timestamp}`;
}

async function logClickMetadata(metadata: ClickMetadata): Promise<void> {
  try {
    // Fire and forget — don't await, don't block UX
    fetch('/api/affiliate/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
      keepalive: true, // Ensures request completes even if page unloads
    }).catch(() => {}); // Silently fail — never break UX for tracking
  } catch {
    // Never throw from tracking
  }
}