// lib/imageSearch.ts - Fixed to work in both server and client components
// Removed server-only Next.js cache APIs and replaced with simple in-memory cache

import type { PlaceImage } from '@/lib/Image';

// --- TYPE DEFINITIONS for external APIs ---

interface GooglePlaceDetailsPhoto {
  photo_reference: string;
  width: number;
  height: number;
  html_attributions: string[];
}

interface UnsplashPhoto {
  urls: {
    regular: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

interface PexelsPhoto {
  src: {
    large2x: string;
    large: string;
  };
  photographer: string;
  photographer_url: string;
}

// --- FALLBACK IMAGES (UPGRADED with 'source' property) ---

const FALLBACK_IMAGES: Record<string, PlaceImage[]> = {
  paris: [
    {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      attributions:
        'Photo by <a href="https://unsplash.com/@chriskaridis?utm_source=GladysTravelAI&utm_medium=referral">Chris Karidis</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>',
      source: 'fallback',
    },
  ],
  tokyo: [
    {
      url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      attributions:
        'Photo by <a href="https://unsplash.com/@jezael?utm_source=GladysTravelAI&utm_medium=referral">Jezael Melgoza</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>',
      source: 'fallback',
    },
  ],
  'new york': [
    {
      url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
      attributions:
        'Photo by <a href="https://unsplash.com/@dancitu?utm_source=GladysTravelAI&utm_medium=referral">Andrej Lisakov</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>',
      source: 'fallback',
    },
  ],
  generic: [
    {
      url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      attributions:
        'Photo by <a href="https://unsplash.com/@element5digital?utm_source=GladysTravelAI&utm_medium=referral">Element5 Digital</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>',
      source: 'fallback',
    },
    {
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
      attributions:
        'Photo by <a href="https://unsplash.com/@fransaraco?utm_source=GladysTravelAI&utm_medium=referral">Francesco Saraco</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>',
      source: 'fallback',
    },
  ],
};

// --- API KEYS ---
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// --- IN-MEMORY CACHE (Replaces Next.js cache) ---

interface CacheEntry {
  data: PlaceImage[];
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 60 * 60 * 24 * 1000; // 24 hours in milliseconds

function getCachedImages(destination: string): PlaceImage[] | null {
  const cacheKey = `destination-images:${destination.toLowerCase()}`;
  const cached = imageCache.get(cacheKey);
  
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    imageCache.delete(cacheKey);
    return null;
  }
  
  console.log(`CACHE_HIT: Using cached images for [${destination}]`);
  return cached.data;
}

function setCachedImages(destination: string, images: PlaceImage[]): void {
  const cacheKey = `destination-images:${destination.toLowerCase()}`;
  imageCache.set(cacheKey, {
    data: images,
    timestamp: Date.now()
  });
}

// --- INTERNAL FETCHER FUNCTIONS ---

/**
 * Strategy 1: Fetch images from Google Places API
 */
async function _fetchGoogleImages(
  destination: string,
  apiKey: string
): Promise<PlaceImage[] | null> {
  try {
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      destination
    )}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const findPlaceResponse = await fetch(findPlaceUrl);
    const findPlaceData = await findPlaceResponse.json();

    if (
      findPlaceData.status !== 'OK' ||
      !findPlaceData.candidates?.[0]?.place_id
    ) {
      console.log('Google Places: No place_id found for', destination);
      return null;
    }
    const placeId = findPlaceData.candidates[0].place_id;

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsData.result?.photos || detailsData.result.photos.length === 0) {
      console.log('Google Places: No photos found for place_id', placeId);
      return null;
    }

    const placeImages: PlaceImage[] = detailsData.result.photos
      .slice(0, 6)
      .map((photo: GooglePlaceDetailsPhoto) => {
        const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${apiKey}`;
        return {
          url: url,
          attributions: photo.html_attributions[0] || 'Google Maps User',
          source: 'google_places',
        };
      });

    console.log(`✅ Google Places: Found ${placeImages.length} images`);
    return placeImages;
  } catch (error) {
    console.error('❌ Google Places API Error:', error);
    return null;
  }
}

/**
 * Strategy 2: Fetch images from Unsplash API
 */
async function _fetchUnsplashImages(
  destination: string,
  apiKey: string
): Promise<PlaceImage[] | null> {
  try {
    const query = `${destination} travel city landmark`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=6&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log('Unsplash API: Request failed');
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.log('Unsplash API: No photos found');
      return null;
    }

    const placeImages: PlaceImage[] = data.results.map(
      (photo: UnsplashPhoto) => ({
        url: photo.urls.regular,
        attributions: `Photo by <a href="${photo.user.links.html}?utm_source=GladysTravelAI&utm_medium=referral">${photo.user.name}</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral">Unsplash</a>`,
        source: 'unsplash',
      })
    );

    console.log(`✅ Unsplash: Found ${placeImages.length} images`);
    return placeImages;
  } catch (error) {
    console.error('❌ Unsplash API Error:', error);
    return null;
  }
}

/**
 * Strategy 3: Fetch images from Pexels API
 */
async function _fetchPexelsImages(
  destination: string,
  apiKey: string
): Promise<PlaceImage[] | null> {
  try {
    const query = `${destination} travel tourism landmark`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&per_page=6&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      console.log('Pexels API: Request failed');
      return null;
    }

    const data = await response.json();
    if (!data.photos || data.photos.length === 0) {
      console.log('Pexels API: No photos found');
      return null;
    }

    const placeImages: PlaceImage[] = data.photos.map((photo: PexelsPhoto) => ({
      url: photo.src.large2x || photo.src.large,
      attributions: `Photo by <a href="${photo.photographer_url}">${photo.photographer}</a> on <a href="https://pexels.com">Pexels</a>`,
      source: 'pexels',
    }));

    console.log(`✅ Pexels: Found ${placeImages.length} images`);
    return placeImages;
  } catch (error) {
    console.error('❌ Pexels API Error:', error);
    return null;
  }
}

/**
 * Strategy 4: Get fallback images for common destinations
 */
function _getFallbackImages(destination: string): PlaceImage[] {
  const normalizedDest = destination.toLowerCase().trim();

  if (FALLBACK_IMAGES[normalizedDest]) {
    console.log(`✅ Fallback: Using curated images for ${destination}`);
    return FALLBACK_IMAGES[normalizedDest];
  }

  for (const [key, images] of Object.entries(FALLBACK_IMAGES)) {
    if (key !== 'generic' && normalizedDest.includes(key)) {
      console.log(`✅ Fallback: Using curated images for ${key}`);
      return images;
    }
  }

  console.log(`✅ Fallback: Using generic travel images`);
  return FALLBACK_IMAGES.generic;
}

// ---
// 🚀 THE CACHED ORCHESTRATOR (Now with in-memory cache instead of Next.js cache)
// ---

/**
 * Fetches destination images with a 3-layer API fallback
 * and a final hard-coded fallback. Results are cached for 24 hours.
 * This is the primary function to be used by frontend components.
 */
export async function fetchImages(destination: string): Promise<PlaceImage[]> {
  // Check cache first
  const cachedImages = getCachedImages(destination);
  if (cachedImages) {
    return cachedImages;
  }

  console.log(`CACHE_MISS: Fetching fresh images for [${destination}]`);

  let images: PlaceImage[] | null = null;

  // Strategy 1: Google (Most relevant)
  if (GOOGLE_API_KEY) {
    images = await _fetchGoogleImages(destination, GOOGLE_API_KEY);
  }

  // Strategy 2: Unsplash (High quality)
  if (!images && UNSPLASH_API_KEY) {
    images = await _fetchUnsplashImages(destination, UNSPLASH_API_KEY);
  }

  // Strategy 3: Pexels (More high quality)
  if (!images && PEXELS_API_KEY) {
    images = await _fetchPexelsImages(destination, PEXELS_API_KEY);
  }

  // Strategy 4: Final Fallback (Guaranteed content)
  if (!images || images.length === 0) {
    images = _getFallbackImages(destination);
  }

  // Cache the results
  setCachedImages(destination, images);

  return images;
}

/**
 * ALIAS: Export as imageSearch for backward compatibility
 */
export const imageSearch = fetchImages;

/**
 * Clear the image cache manually
 */
export const clearImageCache = () => {
  imageCache.clear();
  console.log("MANUAL: Cleared destination image cache.");
};

/**
 * Get cache statistics (useful for debugging)
 */
export const getImageCacheStats = () => {
  return {
    size: imageCache.size,
    entries: Array.from(imageCache.keys()),
  };
};