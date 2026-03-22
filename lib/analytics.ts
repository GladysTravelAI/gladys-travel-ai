// lib/analytics.ts
// Google Analytics 4 event tracking helpers
// Call these throughout the app to track key user actions

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function gtag(...args: any[]) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag(...args);
}

// ── Core tracker ──────────────────────────────────────────────────────────────

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  gtag('event', eventName, params);
}

// ── Search events ─────────────────────────────────────────────────────────────

export function trackSearch(query: string, resultCount?: number) {
  gtag('event', 'search', {
    search_term:  query,
    result_count: resultCount,
  });
}

export function trackEventSearch(query: string, eventType?: string) {
  gtag('event', 'event_search', {
    search_term: query,
    event_type:  eventType ?? 'unknown',
  });
}

// ── Trip planning ─────────────────────────────────────────────────────────────

export function trackTripPlanGenerated(params: {
  eventName:  string;
  eventType:  string;
  city:       string;
  days?:      number;
  source?:    'search' | 'gladys_chat' | 'explore';
}) {
  gtag('event', 'trip_plan_generated', {
    event_name:  params.eventName,
    event_type:  params.eventType,
    city:        params.city,
    trip_days:   params.days ?? 5,
    source:      params.source ?? 'search',
  });
}

// ── Affiliate clicks (revenue tracking) ───────────────────────────────────────

export function trackAffiliateClick(params: {
  partner:    string;  // 'ticketmaster' | 'booking' | 'spothero' | 'uber' etc.
  type:       string;  // 'ticket' | 'hotel' | 'flight' | 'parking' | 'esim'
  eventName?: string;
  city?:      string;
  value?:     number;  // estimated commission value
}) {
  gtag('event', 'affiliate_click', {
    affiliate_partner: params.partner,
    affiliate_type:    params.type,
    event_name:        params.eventName ?? '',
    city:              params.city ?? '',
    value:             params.value ?? 0,
    currency:          'USD',
  });
}

export function trackTicketClick(eventName: string, city: string, partner = 'ticketmaster') {
  trackAffiliateClick({ partner, type: 'ticket', eventName, city });
}

export function trackHotelClick(city: string, partner = 'booking') {
  trackAffiliateClick({ partner, type: 'hotel', city });
}

export function trackFlightClick(city: string, partner = 'travelpayouts') {
  trackAffiliateClick({ partner, type: 'flight', city });
}

// ── Gladys Companion ──────────────────────────────────────────────────────────

export function trackGladysOpen(mode: 'voice' | 'chat') {
  gtag('event', 'gladys_open', { mode });
}

export function trackGladysMessage(intent: 'trip' | 'live' | 'checklist' | 'chat' | 'airport') {
  gtag('event', 'gladys_message', { intent });
}

// ── User journey ──────────────────────────────────────────────────────────────

export function trackSignUp(method: 'email' | 'google') {
  gtag('event', 'sign_up', { method });
}

export function trackSignIn(method: 'email' | 'google') {
  gtag('event', 'login', { method });
}

export function trackWaitlistJoin(source?: string) {
  gtag('event', 'waitlist_join', { source: source ?? 'homepage' });
}

// ── Page timing ───────────────────────────────────────────────────────────────

export function trackPageView(path: string, title?: string) {
  gtag('event', 'page_view', {
    page_path:  path,
    page_title: title,
  });
}