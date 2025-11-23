import { NextRequest, NextResponse } from 'next/server';

// Fallback destinations with guaranteed images
const FALLBACK_IMAGES: Record<string, string[]> = {
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a'
  ],
  'tokyo': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26'
  ],
  'new york': [
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    'https://images.unsplash.com/photo-1522083165195-3424ed129620',
    'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2'
  ],
  'dubai': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
    'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090'
  ],
  'london': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    'https://images.unsplash.com/photo-1505761671935-60b3a7427bad',
    'https://images.unsplash.com/photo-1486299267070-83823f5448dd'
  ],
  'miami': [
    'https://images.unsplash.com/photo-1506059612708-99d6c258160e',
    'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2',
    'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f'
  ],
  'los angeles': [
    'https://images.unsplash.com/photo-1534190239940-9ba8944ea261',
    'https://images.unsplash.com/photo-1580655653885-65763b2597d0',
    'https://images.unsplash.com/photo-1515496281361-241a540151a5'
  ],
  'san francisco': [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
    'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb',
    'https://images.unsplash.com/photo-1449034446853-66c86144b0ad'
  ]
};

/**
 * ✅ NEW Google Places API Implementation
 * Uses Places API (New) - v1
 */
async function fetchGooglePlacesImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    console.log(`🔍 Google Places (NEW API): Searching for "${destination}"`);
    
    if (!apiKey || apiKey === 'your_key_here') {
      console.log('⚠️ Google Places API key not configured');
      return [];
    }

    // NEW Places API endpoint
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody = {
      textQuery: destination,
      languageCode: 'en',
      maxResultCount: 1
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Request specific fields to save on quota
        'X-Goog-FieldMask': 'places.displayName,places.photos,places.formattedAddress'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Handle errors
    if (data.error) {
      console.error('❌ Google Places API Error:', data.error.message);
      console.error('Status:', data.error.status);
      
      if (data.error.message?.includes('legacy API')) {
        console.error('⚠️ SOLUTION: Enable "Places API (New)" in Google Cloud Console');
        console.error('Go to: https://console.cloud.google.com/apis/library');
        console.error('Search: "Places API (New)" and click Enable');
      }
      
      if (data.error.message?.includes('billing')) {
        console.error('⚠️ SOLUTION: Set up billing in Google Cloud Console');
        console.error('Go to: https://console.cloud.google.com/billing');
      }
      
      return [];
    }

    // Check if we got results
    if (!data.places || data.places.length === 0) {
      console.log('Google Places: No results found for', destination);
      return [];
    }

    const place = data.places[0];
    const placeName = place.displayName?.text || destination;
    const photos = place.photos;

    if (!photos || photos.length === 0) {
      console.log(`Google Places: Found "${placeName}" but no photos available`);
      return [];
    }

    console.log(`✓ Found: ${placeName} with ${photos.length} photos`);

    // NEW API: Build photo URLs using photo.name
    const imageUrls = photos
      .slice(0, 6)
      .map((photo: any) => {
        // Photo name format: "places/ChIJxxx/photos/xxx"
        const photoName = photo.name;
        return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1200&maxWidthPx=1200&key=${apiKey}`;
      });

    console.log(`✅ Google Places (NEW): Generated ${imageUrls.length} photo URLs for ${placeName}`);
    return imageUrls;

  } catch (error: any) {
    console.error('Google Places API Error:', error.message);
    return [];
  }
}

/**
 * Fetch images from Pexels API
 */
async function fetchPexelsImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    const query = `${destination} travel tourism landmark`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      console.log('Pexels API: Request failed');
      return [];
    }

    const data = await response.json();
    
    if (!data.photos || data.photos.length === 0) {
      console.log('Pexels API: No photos found');
      return [];
    }

    const imageUrls = data.photos.map((photo: any) => photo.src.large2x || photo.src.large);
    console.log(`✅ Pexels: Found ${imageUrls.length} images`);
    return imageUrls;

  } catch (error) {
    console.error('Pexels API Error:', error);
    return [];
  }
}

/**
 * Fetch images from Unsplash API
 */
async function fetchUnsplashImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    const query = `${destination} travel city landmark`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      console.log('Unsplash API: Request failed');
      return [];
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('Unsplash API: No photos found');
      return [];
    }

    const imageUrls = data.results.map((photo: any) => photo.urls.regular);
    console.log(`✅ Unsplash: Found ${imageUrls.length} images`);
    return imageUrls;

  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}

/**
 * Get fallback images for common destinations
 */
function getFallbackImages(destination: string): string[] {
  const normalizedDest = destination.toLowerCase().trim();
  
  // Check exact matches
  if (FALLBACK_IMAGES[normalizedDest]) {
    console.log(`✅ Fallback: Using curated images for ${destination}`);
    return FALLBACK_IMAGES[normalizedDest];
  }
  
  // Check partial matches
  for (const [key, images] of Object.entries(FALLBACK_IMAGES)) {
    if (normalizedDest.includes(key)) {
      console.log(`✅ Fallback: Using curated images for ${key}`);
      return images;
    }
  }
  
  // Generic travel images as last resort
  return [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
  ];
}

/**
 * Main POST endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { destination } = await req.json();

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json(
        { error: 'Valid destination string is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching images for: ${destination}`);

    // Get all API keys
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    let images: string[] = [];

    // Strategy 1: Try Google Places NEW API first (REAL photos of actual places!)
    if (googleKey) {
      images = await fetchGooglePlacesImages(destination, googleKey);
      if (images.length > 0) {
        return NextResponse.json({ 
          images, 
          source: 'google_places_new',
          count: images.length,
          note: 'Real photos from Google Places (NEW API)'
        });
      }
    } else {
      console.log('⚠️ Google Places API key not configured');
    }

    // Strategy 2: Try Unsplash (high quality, travel-focused)
    if (unsplashKey && images.length === 0) {
      images = await fetchUnsplashImages(destination, unsplashKey);
      if (images.length > 0) {
        return NextResponse.json({ 
          images, 
          source: 'unsplash',
          count: images.length 
        });
      }
    }

    // Strategy 3: Try Pexels (good variety)
    if (pexelsKey && images.length === 0) {
      images = await fetchPexelsImages(destination, pexelsKey);
      if (images.length > 0) {
        return NextResponse.json({ 
          images, 
          source: 'pexels',
          count: images.length 
        });
      }
    }

    // Strategy 4: Use curated fallback images
    if (images.length === 0) {
      images = getFallbackImages(destination);
      return NextResponse.json({ 
        images, 
        source: 'fallback',
        count: images.length,
        note: 'Using curated images. Add Google Places API key for real destination photos.'
      });
    }

    return NextResponse.json({ 
      images: [],
      source: 'none',
      count: 0,
      error: 'No images found'
    });

  } catch (error) {
    console.error('Error in /api/images:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  const hasGoogle = !!process.env.GOOGLE_PLACES_API_KEY;
  const hasPexels = !!process.env.PEXELS_API_KEY;
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;

  return NextResponse.json({
    status: 'operational',
    service: 'GladysTravelAI Image API',
    apiVersion: 'Places API (New) - v1',
    sources: {
      google_places: hasGoogle ? '✅ configured (NEW API)' : '❌ missing - add for real photos',
      pexels: hasPexels ? '✅ configured' : '❌ missing',
      unsplash: hasUnsplash ? '✅ configured' : '❌ missing',
      fallback: '✅ always available'
    },
    setup_instructions: !hasGoogle ? {
      step1: 'Go to https://console.cloud.google.com/apis/library',
      step2: 'Search for "Places API (New)" and enable it',
      step3: 'Set up billing (required even for free tier)',
      step4: 'Add GOOGLE_PLACES_API_KEY to your .env file'
    } : null,
    recommendation: !hasGoogle 
      ? 'Add GOOGLE_PLACES_API_KEY for real destination photos!'
      : 'Fully configured - serving real photos via NEW API',
    priority: 'Google Places (NEW) > Unsplash > Pexels > Fallback'
  });
}