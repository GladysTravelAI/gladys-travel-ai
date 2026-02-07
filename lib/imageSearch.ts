// lib/imageSearch.ts
// Production-grade image search service with multi-source fallback
// Works in both server and client components

import type { PlaceImage, ImageCacheEntry, ImageServiceConfig } from '@/lib/Image';
import { buildUnsplashAttribution, buildPexelsAttribution } from '@/lib/Image';
import { buildSearchQuery, getLandmarks } from '@/lib/eventLandmarkMaps';

// ==================== CONFIGURATION ====================

const CONFIG: ImageServiceConfig = {
  googlePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY,
  unsplashAccessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY,
  pexelsApiKey: process.env.NEXT_PUBLIC_PEXELS_API_KEY || process.env.PEXELS_API_KEY,
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  maxImages: 5,
  debug: process.env.NODE_ENV === 'development',
};

// ==================== IN-MEMORY CACHE ====================

const imageCache = new Map<string, ImageCacheEntry>();

function getCacheKey(destination: string): string {
  return `images:${destination.toLowerCase().trim()}`;
}

function getCachedImages(destination: string): PlaceImage[] | null {
  const key = getCacheKey(destination);
  const cached = imageCache.get(key);
  
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > (CONFIG.cacheDuration || 86400000);
  if (isExpired) {
    imageCache.delete(key);
    return null;
  }
  
  if (CONFIG.debug) {
    console.log(`✅ CACHE HIT: Using cached images for "${destination}" (source: ${cached.source})`);
  }
  
  return cached.images;
}

function setCachedImages(destination: string, images: PlaceImage[], source: string): void {
  const key = getCacheKey(destination);
  imageCache.set(key, {
    images,
    timestamp: Date.now(),
    source,
  });
  
  if (CONFIG.debug) {
    console.log(`💾 CACHE SET: Stored ${images.length} images for "${destination}" (source: ${source})`);
  }
}

export function clearImageCache(): void {
  imageCache.clear();
  console.log('🗑️ Image cache cleared');
}

export function getImageCacheStats() {
  return {
    size: imageCache.size,
    entries: Array.from(imageCache.keys()),
  };
}

// ==================== FALLBACK IMAGES ====================

const FALLBACK_IMAGES: Record<string, PlaceImage[]> = {
  paris: [
    {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
      attributions: buildUnsplashAttribution('Chris Karidis', 'https://unsplash.com/@chriskaridis'),
      source: 'fallback',
      photographer: 'Chris Karidis',
    },
    {
      url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200',
      attributions: buildUnsplashAttribution('Alex Azabache', 'https://unsplash.com/@alexazabache'),
      source: 'fallback',
      photographer: 'Alex Azabache',
    },
  ],
  tokyo: [
    {
      url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
      attributions: buildUnsplashAttribution('Jezael Melgoza', 'https://unsplash.com/@jezael'),
      source: 'fallback',
      photographer: 'Jezael Melgoza',
    },
    {
      url: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1200',
      attributions: buildUnsplashAttribution('Susann Schuster', 'https://unsplash.com/@susannschuster'),
      source: 'fallback',
      photographer: 'Susann Schuster',
    },
  ],
  'new york': [
    {
      url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
      attributions: buildUnsplashAttribution('Anthony DELANOIX', 'https://unsplash.com/@anthonydelanoix'),
      source: 'fallback',
      photographer: 'Anthony DELANOIX',
    },
    {
      url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1200',
      attributions: buildUnsplashAttribution('Noel Y', 'https://unsplash.com/@noel_y'),
      source: 'fallback',
      photographer: 'Noel Y',
    },
  ],
  london: [
    {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
      attributions: buildUnsplashAttribution('Luke Stackpoole', 'https://unsplash.com/@withluke'),
      source: 'fallback',
      photographer: 'Luke Stackpoole',
    },
  ],
  dubai: [
    {
      url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
      attributions: buildUnsplashAttribution('ZQ Lee', 'https://unsplash.com/@zqlee'),
      source: 'fallback',
      photographer: 'ZQ Lee',
    },
  ],
  rome: [
    {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
      attributions: buildUnsplashAttribution('Andrea Cipriani', 'https://unsplash.com/@andreacipriani'),
      source: 'fallback',
      photographer: 'Andrea Cipriani',
    },
  ],
  generic: [
    {
      url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
      attributions: buildUnsplashAttribution('Element5 Digital', 'https://unsplash.com/@element5digital'),
      source: 'fallback',
      photographer: 'Element5 Digital',
    },
    {
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200',
      attributions: buildUnsplashAttribution('Francesco Saraco', 'https://unsplash.com/@fransaraco'),
      source: 'fallback',
      photographer: 'Francesco Saraco',
    },
    {
      url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
      attributions: buildUnsplashAttribution('Chang Duong', 'https://unsplash.com/@iamchang'),
      source: 'fallback',
      photographer: 'Chang Duong',
    },
  ],
};

function getFallbackImages(destination: string): PlaceImage[] {
  const normalized = destination.toLowerCase().trim();
  
  // Direct match
  if (FALLBACK_IMAGES[normalized]) {
    if (CONFIG.debug) {
      console.log(`✅ FALLBACK: Using curated images for "${destination}"`);
    }
    return FALLBACK_IMAGES[normalized];
  }
  
  // Partial match
  for (const [key, images] of Object.entries(FALLBACK_IMAGES)) {
    if (key !== 'generic' && (normalized.includes(key) || key.includes(normalized))) {
      if (CONFIG.debug) {
        console.log(`✅ FALLBACK: Using curated images for "${key}" (matched from "${destination}")`);
      }
      return images;
    }
  }
  
  // Generic fallback
  if (CONFIG.debug) {
    console.log(`✅ FALLBACK: Using generic travel images`);
  }
  return FALLBACK_IMAGES.generic;
}

// ==================== API FETCHERS ====================

/**
 * Fetch images from Google Places API
 */
async function fetchGooglePlacesImages(destination: string): Promise<PlaceImage[] | null> {
  const apiKey = CONFIG.googlePlacesApiKey;
  if (!apiKey) {
    if (CONFIG.debug) console.log('⚠️ Google Places API key not configured');
    return null;
  }

  try {
    const searchQuery = buildSearchQuery(destination, true);
    if (CONFIG.debug) console.log(`🔍 Google Places: Searching for "${searchQuery}"`);

    // Find place ID
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    
    const findResponse = await fetch(findPlaceUrl);
    const findData = await findResponse.json();

    if (findData.status !== 'OK' || !findData.candidates?.[0]?.place_id) {
      if (CONFIG.debug) console.log('❌ Google Places: No place found');
      return null;
    }

    const placeId = findData.candidates[0].place_id;

    // Get place details with photos
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsData.result?.photos || detailsData.result.photos.length === 0) {
      if (CONFIG.debug) console.log('❌ Google Places: No photos found');
      return null;
    }

    const images: PlaceImage[] = detailsData.result.photos
      .slice(0, CONFIG.maxImages)
      .map((photo: any) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${apiKey}`,
        attributions: photo.html_attributions[0] || '<a href="https://maps.google.com">Google Maps User</a>',
        source: 'google_places' as const,
        width: photo.width,
        height: photo.height,
      }));

    if (CONFIG.debug) {
      console.log(`✅ Google Places: Found ${images.length} images`);
    }
    
    return images;
  } catch (error) {
    console.error('❌ Google Places API Error:', error);
    return null;
  }
}

/**
 * Fetch images from Unsplash API
 */
async function fetchUnsplashImages(destination: string): Promise<PlaceImage[] | null> {
  const apiKey = CONFIG.unsplashAccessKey;
  if (!apiKey) {
    if (CONFIG.debug) console.log('⚠️ Unsplash API key not configured');
    return null;
  }

  try {
    const landmarks = getLandmarks(destination);
    let allImages: PlaceImage[] = [];

    // Search for specific landmarks first
    if (landmarks.length > 0) {
      const landmarkQueries = landmarks.slice(0, 2).map(async (landmark) => {
        const query = `${landmark} ${destination}`;
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=2&orientation=landscape`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Client-ID ${apiKey}` },
        });

        if (!response.ok) return [];

        const data = await response.json();
        return (data.results || []).map((photo: any) => ({
          url: photo.urls.regular,
          attributions: buildUnsplashAttribution(photo.user.name, photo.user.links.html),
          source: 'unsplash' as const,
          photographer: photo.user.name,
          width: photo.width,
          height: photo.height,
        }));
      });

      const landmarkResults = await Promise.all(landmarkQueries);
      allImages = landmarkResults.flat();
    }

    // Fallback: general destination search
    if (allImages.length < 3) {
      const searchQuery = buildSearchQuery(destination, false);
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${apiKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        const fallbackImages = (data.results || []).map((photo: any) => ({
          url: photo.urls.regular,
          attributions: buildUnsplashAttribution(photo.user.name, photo.user.links.html),
          source: 'unsplash' as const,
          photographer: photo.user.name,
          width: photo.width,
          height: photo.height,
        }));
        
        allImages = [...allImages, ...fallbackImages];
      }
    }

    // Remove duplicates and limit
    const uniqueImages = Array.from(
      new Map(allImages.map(img => [img.url, img])).values()
    ).slice(0, CONFIG.maxImages);

    if (CONFIG.debug && uniqueImages.length > 0) {
      console.log(`✅ Unsplash: Found ${uniqueImages.length} images`);
    }

    return uniqueImages.length > 0 ? uniqueImages : null;
  } catch (error) {
    console.error('❌ Unsplash API Error:', error);
    return null;
  }
}

/**
 * Fetch images from Pexels API
 */
async function fetchPexelsImages(destination: string): Promise<PlaceImage[] | null> {
  const apiKey = CONFIG.pexelsApiKey;
  if (!apiKey) {
    if (CONFIG.debug) console.log('⚠️ Pexels API key not configured');
    return null;
  }

  try {
    const landmarks = getLandmarks(destination);
    let allImages: PlaceImage[] = [];

    // Search for specific landmarks first
    if (landmarks.length > 0) {
      const landmarkQueries = landmarks.slice(0, 2).map(async (landmark) => {
        const query = `${landmark} ${destination}`;
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=2&orientation=landscape`;

        const response = await fetch(url, {
          headers: { 'Authorization': apiKey },
        });

        if (!response.ok) return [];

        const data = await response.json();
        return (data.photos || []).map((photo: any) => ({
          url: photo.src.large2x || photo.src.large,
          attributions: buildPexelsAttribution(photo.photographer, photo.photographer_url),
          source: 'pexels' as const,
          photographer: photo.photographer,
          width: photo.width,
          height: photo.height,
        }));
      });

      const landmarkResults = await Promise.all(landmarkQueries);
      allImages = landmarkResults.flat();
    }

    // Fallback: general destination search
    if (allImages.length < 3) {
      const searchQuery = buildSearchQuery(destination, false);
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`;

      const response = await fetch(url, {
        headers: { 'Authorization': apiKey },
      });

      if (response.ok) {
        const data = await response.json();
        const fallbackImages = (data.photos || []).map((photo: any) => ({
          url: photo.src.large2x || photo.src.large,
          attributions: buildPexelsAttribution(photo.photographer, photo.photographer_url),
          source: 'pexels' as const,
          photographer: photo.photographer,
          width: photo.width,
          height: photo.height,
        }));
        
        allImages = [...allImages, ...fallbackImages];
      }
    }

    // Remove duplicates and limit
    const uniqueImages = Array.from(
      new Map(allImages.map(img => [img.url, img])).values()
    ).slice(0, CONFIG.maxImages);

    if (CONFIG.debug && uniqueImages.length > 0) {
      console.log(`✅ Pexels: Found ${uniqueImages.length} images`);
    }

    return uniqueImages.length > 0 ? uniqueImages : null;
  } catch (error) {
    console.error('❌ Pexels API Error:', error);
    return null;
  }
}

// ==================== MAIN EXPORT ====================

/**
 * Fetch destination images with intelligent multi-source fallback
 * 
 * Priority order:
 * 1. Google Places (most relevant, location-specific)
 * 2. Unsplash (high quality, well-attributed)
 * 3. Pexels (additional high quality)
 * 4. Fallback (curated images for popular destinations)
 * 
 * Results are cached for 24 hours to reduce API calls
 * 
 * @param destination - City, country, or landmark name
 * @returns Array of PlaceImage objects with URLs and attribution
 */
export async function fetchImages(destination: string): Promise<PlaceImage[]> {
  // Check cache first
  const cachedImages = getCachedImages(destination);
  if (cachedImages) {
    return cachedImages;
  }

  if (CONFIG.debug) {
    console.log(`🔍 FETCH: Searching images for "${destination}"`);
  }

  let images: PlaceImage[] | null = null;
  let source: string = 'none';

  // Strategy 1: Google Places (best for location-specific images)
  images = await fetchGooglePlacesImages(destination);
  if (images && images.length > 0) {
    source = 'google_places';
    setCachedImages(destination, images, source);
    return images;
  }

  // Strategy 2: Unsplash (high quality stock)
  images = await fetchUnsplashImages(destination);
  if (images && images.length > 0) {
    source = 'unsplash';
    setCachedImages(destination, images, source);
    return images;
  }

  // Strategy 3: Pexels (additional high quality)
  images = await fetchPexelsImages(destination);
  if (images && images.length > 0) {
    source = 'pexels';
    setCachedImages(destination, images, source);
    return images;
  }

  // Strategy 4: Fallback (guaranteed content)
  images = getFallbackImages(destination);
  source = 'fallback';
  setCachedImages(destination, images, source);
  
  return images;
}

/**
 * Backward compatibility alias
 */
export const imageSearch = fetchImages;

/**
 * Prefetch images for a destination (useful for optimizing UX)
 */
export async function prefetchImages(destination: string): Promise<void> {
  const cached = getCachedImages(destination);
  if (!cached) {
    await fetchImages(destination);
  }
}

/**
 * Get service health status
 */
export function getServiceStatus() {
  return {
    google_places: !!CONFIG.googlePlacesApiKey,
    unsplash: !!CONFIG.unsplashAccessKey,
    pexels: !!CONFIG.pexelsApiKey,
    cache_size: imageCache.size,
    cache_max_age: CONFIG.cacheDuration,
  };
}