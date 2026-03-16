// app/api/images/route.ts
// UPDATED: Dual-mode image API for event-first travel platform
// Supports both EVENT images and DESTINATION images

import { NextRequest, NextResponse } from 'next/server';
import type { PlaceImage } from '@/lib/Image';
import type { EventImage } from '@/lib/eventImageSearch';

// ==================== REQUEST/RESPONSE TYPES ====================

interface ImageRequest {
  eventQuery?:  string;
  venueName?:   string;
  destination?: string;
  maxImages?:   number;
}

interface ImageResponse {
  eventImages?:       PlaceImage[];
  destinationImages?: PlaceImage[];
  images?:            PlaceImage[];
  source:             string;
  count:              number;
  mode:               'event' | 'destination' | 'combined' | 'error';
  error?:             string;
}

// ==================== HELPERS ====================

/**
 * Map EventImage → PlaceImage.
 * EventImage.source can be 'ticketmaster' which is not a valid PlaceImage source.
 * We map it (and 'local') to 'fallback'.
 */
function toPlaceImages(images: EventImage[]): PlaceImage[] {
  return images.map((img) => ({
    url:          img.url,
    attributions: img.photographer ? `Photo by ${img.photographer}` : 'GladysTravelAI',
    source:       (
      img.source === 'ticketmaster' || img.source === 'local'
        ? 'fallback'
        : img.source
    ) as PlaceImage['source'],
    photographer: img.photographer,
    width:        img.width,
    height:       img.height,
  }));
}

// ==================== API HANDLER ====================

export async function POST(req: NextRequest) {
  try {
    const body: ImageRequest     = await req.json();
    const { eventQuery, venueName, destination, maxImages = 6 } = body;

    if (!eventQuery && !destination) {
      return NextResponse.json(
        { error: 'Either eventQuery or destination is required', mode: 'error', count: 0 } satisfies Partial<ImageResponse>,
        { status: 400 }
      );
    }

    // ── MODE 1: EVENT ONLY ──────────────────────────────────────

    if (eventQuery && !destination) {
      const { fetchEventImages } = await import('@/lib/eventImageSearch');

      const event = {
        id:        eventQuery.toLowerCase().replace(/\s+/g, '-'),
        name:      eventQuery,
        type:      'music' as const,
        location:  { city: venueName || 'Unknown', country: 'Unknown', venue: venueName },
        startDate: '',
        endDate:   '',
      };

      const eventImages = toPlaceImages(await fetchEventImages(event, maxImages));

      return NextResponse.json({
        eventImages,
        images: eventImages,
        source: 'event',
        count:  eventImages.length,
        mode:   'event',
      } satisfies ImageResponse);
    }

    // ── MODE 2: DESTINATION ONLY ────────────────────────────────

    if (destination && !eventQuery) {
      const { fetchImages }      = await import('@/lib/imageSearch');
      const destinationImages    = await fetchImages(destination);

      return NextResponse.json({
        destinationImages,
        images: destinationImages,
        source: 'destination',
        count:  destinationImages.length,
        mode:   'destination',
      } satisfies ImageResponse);
    }

    // ── MODE 3: COMBINED ────────────────────────────────────────

    if (eventQuery && destination) {
      const { fetchEventAndDestinationImages } = await import('@/lib/eventImageSearch');

      const event = {
        id:        eventQuery.toLowerCase().replace(/\s+/g, '-'),
        name:      eventQuery,
        type:      'music' as const,
        location:  { city: destination, country: 'Unknown', venue: venueName },
        startDate: '',
        endDate:   '',
      };

      const { eventImages: rawEvent, destinationImages: rawDest } =
        await fetchEventAndDestinationImages(event, maxImages);

      const eventImages       = toPlaceImages(rawEvent);
      const destinationImages = toPlaceImages(rawDest);
      const combined          = [...eventImages, ...destinationImages];

      return NextResponse.json({
        eventImages,
        destinationImages,
        images: combined,
        source: 'combined',
        count:  combined.length,
        mode:   'combined',
      } satisfies ImageResponse);
    }

    return NextResponse.json(
      { error: 'Invalid request', mode: 'error', count: 0 } satisfies Partial<ImageResponse>,
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', mode: 'error', count: 0 } satisfies Partial<ImageResponse>,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status:  'operational',
    service: 'GladysTravelAI Event-First Image API',
    version: '3.1.0',
    sources: {
      google_places: !!process.env.GOOGLE_PLACES_API_KEY  ? '✅ configured' : '❌ missing',
      unsplash:      !!process.env.UNSPLASH_ACCESS_KEY    ? '✅ configured' : '❌ missing',
      pexels:        !!process.env.PEXELS_API_KEY         ? '✅ configured' : '❌ missing',
      fallback:      '✅ always available',
    },
  });
}