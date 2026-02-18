// app/api/images/route.ts
// UPDATED: Dual-mode image API for event-first travel platform
// Supports both EVENT images and DESTINATION images

import { NextRequest, NextResponse } from 'next/server';
import type { PlaceImage } from '@/lib/Image';
import type { EventImage } from '@/lib/eventImageSearch';

// ==================== REQUEST/RESPONSE TYPES ====================

interface ImageRequest {
  // Mode 1: Event-focused (PRIMARY use case)
  eventQuery?: string;        // "Taylor Swift Eras Tour"
  venueName?: string;         // "Stade de France"
  
  // Mode 2: Destination-focused (SECONDARY - for exploring)
  destination?: string;       // "Paris"
  
  // Mode 3: Combined (RECOMMENDED)
  // Provide both eventQuery AND destination for complete experience
  
  // Common options
  maxImages?: number;
}

interface ImageResponse {
  // Event images (venues, performers, atmosphere)
  eventImages?: PlaceImage[];
  
  // Destination images (landmarks, city exploration)
  destinationImages?: PlaceImage[];
  
  // For backward compatibility
  images?: PlaceImage[];
  
  source: string;
  count: number;
  mode: 'event' | 'destination' | 'combined' | 'error';
  error?: string;
}

// ==================== HELPERS ====================

/**
 * Map EventImage to PlaceImage
 * Bridges the gap between EventImage and PlaceImage by injecting
 * the required `attributions` field that PlaceImage demands
 */
function toPlaceImages(images: EventImage[]): PlaceImage[] {
  return images.map((img) => ({
    url: img.url,
    attributions: img.photographer
      ? `Photo by ${img.photographer}`
      : 'GladysTravelAI',
    source: img.source === 'local' ? 'fallback' : img.source,
    photographer: img.photographer,
    width: img.width,
    height: img.height,
  }));
}


// ==================== API HANDLER ====================

export async function POST(req: NextRequest) {
  try {
    const body: ImageRequest = await req.json();
    const { eventQuery, venueName, destination, maxImages = 6 } = body;

    // Validation
    if (!eventQuery && !destination) {
      return NextResponse.json({
        error: 'Either eventQuery or destination is required',
        mode: 'error',
        count: 0,
      } satisfies Partial<ImageResponse>, { status: 400 });
    }

    // ==================== MODE 1: EVENT ONLY ====================
    if (eventQuery && !destination) {
      const { fetchEventImages } = await import('@/lib/eventImageSearch');

      const event = {
        id: eventQuery.toLowerCase().replace(/\s+/g, '-'),
        name: eventQuery,
        type: 'music' as const,
        location: {
          city: venueName || 'Unknown',
          country: 'Unknown',
          venue: venueName
        },
        startDate: '',
        endDate: ''
      };

      const rawImages = await fetchEventImages(event, maxImages);
      const eventImages = toPlaceImages(rawImages);

      return NextResponse.json({
        eventImages,
        images: eventImages, // Backward compatibility
        source: 'event',
        count: eventImages.length,
        mode: 'event',
      } satisfies ImageResponse);
    }

    // ==================== MODE 2: DESTINATION ONLY ====================
    if (destination && !eventQuery) {
      const { fetchImages } = await import('@/lib/imageSearch');
      const destinationImages = await fetchImages(destination);

      return NextResponse.json({
        destinationImages,
        images: destinationImages, // Backward compatibility
        source: 'destination',
        count: destinationImages.length,
        mode: 'destination',
      } satisfies ImageResponse);
    }

    // ==================== MODE 3: COMBINED (RECOMMENDED) ====================
    if (eventQuery && destination) {
      const { fetchEventAndDestinationImages } = await import('@/lib/eventImageSearch');

      const event = {
        id: eventQuery.toLowerCase().replace(/\s+/g, '-'),
        name: eventQuery,
        type: 'music' as const,
        location: {
          city: destination,
          country: 'Unknown',
          venue: venueName
        },
        startDate: '',
        endDate: ''
      };

      const { eventImages: rawEvent, destinationImages: rawDest } =
        await fetchEventAndDestinationImages(event, maxImages);

      const eventImages      = toPlaceImages(rawEvent);
      const destinationImages = toPlaceImages(rawDest);
      const combined          = [...eventImages, ...destinationImages];

      return NextResponse.json({
        eventImages,
        destinationImages,
        images: combined,
        source: 'combined',
        count: combined.length,
        mode: 'combined',
      } satisfies ImageResponse);
    }

    // Fallback (should never reach here)
    return NextResponse.json({
      error: 'Invalid request',
      mode: 'error',
      count: 0,
    } satisfies Partial<ImageResponse>, { status: 400 });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      mode: 'error',
      count: 0,
    } satisfies Partial<ImageResponse>, { status: 500 });
  }
}

export async function GET() {
  const hasGoogle  = !!process.env.GOOGLE_PLACES_API_KEY;
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;
  const hasPexels  = !!process.env.PEXELS_API_KEY;

  return NextResponse.json({
    status: 'operational',
    service: 'GladysTravelAI Event-First Image API',
    version: '3.0.0',
    description: 'Dual-mode image API for event-focused travel',
    features: {
      event_images: 'Fetch venue, performer, and event atmosphere images',
      destination_images: 'Fetch city landmarks for exploration',
      combined_mode: 'Get both event and destination images in one request',
      attribution: 'Full attribution support for all sources',
    },
    sources: {
      google_places: hasGoogle  ? '✅ configured (venues)'               : '❌ missing',
      unsplash:      hasUnsplash ? '✅ configured (events & destinations)' : '❌ missing',
      pexels:        hasPexels  ? '✅ configured (events & destinations)' : '❌ missing',
      fallback:      '✅ always available',
    },
    usage: {
      event_only:   'POST { eventQuery: "Taylor Swift Eras Tour", venueName: "Stade de France" }',
      destination_only: 'POST { destination: "Paris" }',
      combined:     'POST { eventQuery: "Taylor Swift in Paris", destination: "Paris", venueName: "Stade de France" }',
    },
    endpoints: {
      'POST /api/images': 'Get images (event, destination, or both)',
      'GET /api/images':  'Check API status',
    },
  });
}