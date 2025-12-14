import { NextRequest, NextResponse } from 'next/server';

// Map cities to their iconic landmarks for better image search
const LANDMARK_MAP: Record<string, string> = {
  'paris': 'Eiffel Tower Paris',
  'london': 'Big Ben London Tower Bridge',
  'new york': 'Statue of Liberty New York',
  'tokyo': 'Tokyo Tower Mount Fuji Shibuya',
  'dubai': 'Burj Khalifa Dubai',
  'rome': 'Colosseum Rome',
  'sydney': 'Sydney Opera House',
  'barcelona': 'Sagrada Familia Barcelona',
  'amsterdam': 'Amsterdam canals windmills',
  'prague': 'Prague Castle Charles Bridge',
  'vienna': 'Schonbrunn Palace Vienna',
  'istanbul': 'Hagia Sophia Istanbul Blue Mosque',
  'athens': 'Parthenon Acropolis Athens',
  'budapest': 'Hungarian Parliament Budapest',
  'dublin': 'Trinity College Dublin Temple Bar',
  'edinburgh': 'Edinburgh Castle',
  'lisbon': 'Belem Tower Lisbon',
  'copenhagen': 'Little Mermaid Copenhagen Nyhavn',
  'berlin': 'Brandenburg Gate Berlin Wall',
  'bangkok': 'Grand Palace Bangkok Wat Arun',
  'singapore': 'Marina Bay Sands Gardens by the Bay',
  'hong kong': 'Victoria Peak Hong Kong skyline',
  'seoul': 'Gyeongbokgung Palace Seoul Tower',
  'bali': 'Bali temples Ubud rice terraces',
  'shanghai': 'Oriental Pearl Tower Bund Shanghai',
  'kuala lumpur': 'Petronas Towers Kuala Lumpur',
  'osaka': 'Osaka Castle Dotonbori',
  'los angeles': 'Hollywood Sign Los Angeles',
  'miami': 'Miami Beach South Beach Art Deco',
  'las vegas': 'Las Vegas Strip Bellagio',
  'san francisco': 'Golden Gate Bridge San Francisco',
  'chicago': 'Cloud Gate Chicago skyline',
  'cancun': 'Cancun beaches Mayan ruins',
  'mexico city': 'Teotihuacan pyramids Mexico City',
  'rio de janeiro': 'Christ the Redeemer Copacabana Rio',
  'buenos aires': 'Obelisk Buenos Aires colorful houses',
  'vancouver': 'Vancouver harbor mountains',
  'toronto': 'CN Tower Toronto',
  'cape town': 'Table Mountain Cape Town',
  'marrakech': 'Marrakech medina Jemaa el-Fnaa',
  'cairo': 'Pyramids Giza Sphinx Cairo',
  'nairobi': 'Nairobi National Park Kenya',
  'johannesburg': 'Johannesburg skyline',
  'tel aviv': 'Tel Aviv beaches Mediterranean',
  'melbourne': 'Melbourne skyline Federation Square',
  'auckland': 'Auckland Sky Tower harbor',
  'queenstown': 'Queenstown mountains Lake Wakatipu',
  'bora bora': 'Bora Bora overwater bungalows',
  'fiji': 'Fiji islands beaches paradise'
};

// Get landmark-focused search query
function getLandmarkQuery(destination: string): string {
  const normalized = destination.toLowerCase().trim();
  
  // Check exact match
  if (LANDMARK_MAP[normalized]) {
    return LANDMARK_MAP[normalized];
  }
  
  // Check partial match
  for (const [key, landmark] of Object.entries(LANDMARK_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return landmark;
    }
  }
  
  // Default: add "landmark" to search
  return `${destination} famous landmark iconic`;
}

// Fallback destinations with landmark images
const FALLBACK_IMAGES: Record<string, string[]> = {
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', // Eiffel Tower
    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f', // Arc de Triomphe
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a'  // Notre Dame
  ],
  'tokyo': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', // Tokyo Tower
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8', // Shibuya
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26'  // Mount Fuji
  ],
  'new york': [
    'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee', // Statue of Liberty
    'https://images.unsplash.com/photo-1522083165195-3424ed129620', // Brooklyn Bridge
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'  // NYC Skyline
  ],
  'dubai': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', // Burj Khalifa
    'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5', // Dubai Marina
    'https://images.unsplash.com/photo-1518684079-3c830dcef090'  // Palm Jumeirah
  ],
  'london': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad', // Big Ben
    'https://images.unsplash.com/photo-1505761671935-60b3a7427bad', // Tower Bridge
    'https://images.unsplash.com/photo-1486299267070-83823f5448dd'  // London Eye
  ]
};

async function fetchGooglePlacesImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    const landmarkQuery = getLandmarkQuery(destination);
    console.log(`🔍 Google Places: Searching for "${landmarkQuery}"`);

    if (!apiKey || apiKey === 'your_key_here') {
      console.log('⚠️ Google Places API key not configured');
      return [];
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';

    const requestBody = {
      textQuery: landmarkQuery,
      languageCode: 'en',
      maxResultCount: 1
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.photos,places.formattedAddress'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Google Places API Error:', data.error.message);
      return [];
    }

    if (!data.places || data.places.length === 0) {
      console.log('Google Places: No results found');
      return [];
    }

    const place = data.places[0];
    const photos = place.photos;

    if (!photos || photos.length === 0) {
      return [];
    }

    const imageUrls = photos
      .slice(0, 6)
      .map((photo: any) => {
        const photoName = photo.name;
        return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1200&maxWidthPx=1200&key=${apiKey}`;
      });

    console.log(`✅ Google Places: Found ${imageUrls.length} landmark photos`);
    return imageUrls;

  } catch (error: any) {
    console.error('Google Places API Error:', error.message);
    return [];
  }
}

async function fetchPexelsImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    const landmarkQuery = getLandmarkQuery(destination);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(landmarkQuery)}&per_page=6&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return [];
    }

    const imageUrls = data.photos.map((photo: any) => photo.src.large2x || photo.src.large);
    console.log(`✅ Pexels: Found ${imageUrls.length} landmark images`);
    return imageUrls;

  } catch (error) {
    console.error('Pexels API Error:', error);
    return [];
  }
}

async function fetchUnsplashImages(destination: string, apiKey: string): Promise<string[]> {
  try {
    const landmarkQuery = getLandmarkQuery(destination);
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(landmarkQuery)}&per_page=6&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    const imageUrls = data.results.map((photo: any) => photo.urls.regular);
    console.log(`✅ Unsplash: Found ${imageUrls.length} landmark images`);
    return imageUrls;

  } catch (error) {
    console.error('Unsplash API Error:', error);
    return [];
  }
}

function getFallbackImages(destination: string): string[] {
  const normalizedDest = destination.toLowerCase().trim();

  if (FALLBACK_IMAGES[normalizedDest]) {
    console.log(`✅ Fallback: Using landmark images for ${destination}`);
    return FALLBACK_IMAGES[normalizedDest];
  }

  for (const [key, images] of Object.entries(FALLBACK_IMAGES)) {
    if (normalizedDest.includes(key)) {
      console.log(`✅ Fallback: Using landmark images for ${key}`);
      return images;
    }
  }

  return [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { destination } = await req.json();

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json(
        { error: 'Valid destination string is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching landmark images for: ${destination}`);

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    let images: string[] = [];

    if (googleKey) {
      images = await fetchGooglePlacesImages(destination, googleKey);
      if (images.length > 0) {
        return NextResponse.json({
          images,
          source: 'google_places',
          count: images.length
        });
      }
    }

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

    if (images.length === 0) {
      images = getFallbackImages(destination);
      return NextResponse.json({
        images,
        source: 'fallback',
        count: images.length
      });
    }

    return NextResponse.json({
      images: [],
      source: 'none',
      count: 0
    });

  } catch (error) {
    console.error('Error in /api/images:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const hasGoogle = !!process.env.GOOGLE_PLACES_API_KEY;
  const hasPexels = !!process.env.PEXELS_API_KEY;
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;

  return NextResponse.json({
    status: 'operational',
    service: 'GladysTravelAI Landmark Image API',
    sources: {
      google_places: hasGoogle ? '✅ configured' : '❌ missing',
      pexels: hasPexels ? '✅ configured' : '❌ missing',
      unsplash: hasUnsplash ? '✅ configured' : '❌ missing',
      fallback: '✅ always available'
    }
  });
}