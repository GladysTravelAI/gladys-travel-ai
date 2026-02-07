
/// lib/images.ts
// Complete type definitions for the GladysTravelAI image system

/**
 * Represents an image from any source (Google Places, Unsplash, Pexels, or fallback)
 * 
 * IMPORTANT: All image sources require attribution as per their Terms of Service
 * - Google Places: Must display html_attributions
 * - Unsplash: Must credit photographer with link
 * - Pexels: Must credit photographer with link
 */
export interface PlaceImage {
  /**
   * The final, usable URL for the image.
   * This can be placed directly into an <img src> tag.
   * 
   * Examples:
   * - Google: https://maps.googleapis.com/maps/api/place/photo?...
   * - Unsplash: https://images.unsplash.com/photo-...
   * - Pexels: https://images.pexels.com/photos/...
   */
  url: string;

  /**
   * The HTML attribution string required by the image source.
   * You MUST display this next to the image, as per their terms of service.
   * 
   * Rendering example:
   * <div className="text-xs text-gray-500">
   *   <span dangerouslySetInnerHTML={{ __html: image.attributions }} />
   * </div>
   * 
   * Format examples:
   * - Google: '<a href="https://...">Google User</a>'
   * - Unsplash: 'Photo by <a href="...">Photographer Name</a> on <a href="...">Unsplash</a>'
   * - Pexels: 'Photo by <a href="...">Photographer</a> on <a href="...">Pexels</a>'
   */
  attributions: string;

  /**
   * Source of the image for tracking/analytics
   */
  source: 'google_places' | 'unsplash' | 'pexels' | 'fallback';

  /**
   * Optional: Photographer name (parsed from attributions)
   * Useful for display without HTML rendering
   */
  photographer?: string;

  /**
   * Optional: Image width (if available from API)
   */
  width?: number;

  /**
   * Optional: Image height (if available from API)
   */
  height?: number;
}

/**
 * Response from /api/images endpoint
 * Returns PlaceImage objects with full attribution data
 */
export interface ImagesApiResponse {
  /**
   * Array of images with URLs and attribution
   */
  images: PlaceImage[];

  /**
   * Source that successfully returned images
   */
  source: 'google_places' | 'unsplash' | 'pexels' | 'fallback' | 'none';

  /**
   * Number of images returned
   */
  count: number;

  /**
   * Optional note about the response
   * Example: "Using fallback images for unknown destination"
   */
  note?: string;

  /**
   * Error message if request failed
   */
  error?: string;

  /**
   * Destination that was searched
   */
  destination?: string;
}

/**
 * Error response from /api/images endpoint
 */
export interface ApiError {
  error: string;
  details?: string;
  status?: number;
}

/**
 * Request body for /api/images endpoint
 */
export interface ImagesApiRequest {
  /**
   * Destination name (city, country, landmark)
   * Examples: "Paris", "Tokyo", "Grand Canyon"
   */
  destination: string;

  /**
   * Optional: Maximum number of images to return
   * Default: 5
   */
  maxImages?: number;

  /**
   * Optional: Preferred image orientation
   * Default: 'landscape'
   */
  orientation?: 'landscape' | 'portrait' | 'square';

  /**
   * Optional: Preferred source (for testing)
   * If specified, only this source will be tried
   */
  preferredSource?: 'google_places' | 'unsplash' | 'pexels';
}

/**
 * Google Places Photo Reference
 * Used internally for Google Places API
 */
export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

/**
 * Google Places API response
 */
export interface GooglePlacesResponse {
  candidates?: Array<{
    place_id: string;
  }>;
  result?: {
    photos?: GooglePlacePhoto[];
  };
  status: string;
  error_message?: string;
}

/**
 * Unsplash API photo object
 */
export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  width: number;
  height: number;
}

/**
 * Unsplash API response
 */
export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Pexels API photo object
 */
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

/**
 * Pexels API response
 */
export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

/**
 * Image cache entry (for internal use)
 */
export interface ImageCacheEntry {
  images: PlaceImage[];
  timestamp: number;
  source: string;
}

/**
 * Image service configuration
 */
export interface ImageServiceConfig {
  /**
   * Google Places API key
   */
  googlePlacesApiKey?: string;

  /**
   * Unsplash Access Key
   */
  unsplashAccessKey?: string;

  /**
   * Pexels API Key
   */
  pexelsApiKey?: string;

  /**
   * Cache duration in milliseconds
   * Default: 24 hours
   */
  cacheDuration?: number;

  /**
   * Maximum images per request
   * Default: 5
   */
  maxImages?: number;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Attribution requirements for each service
 */
export const ATTRIBUTION_REQUIREMENTS = {
  google_places: {
    required: true,
    format: 'html',
    display: 'Must display html_attributions near image',
    terms: 'https://developers.google.com/maps/documentation/places/web-service/policies',
  },
  unsplash: {
    required: true,
    format: 'html',
    display: 'Must credit photographer with link to profile and Unsplash',
    terms: 'https://unsplash.com/license',
  },
  pexels: {
    required: true,
    format: 'html',
    display: 'Must credit photographer with link to profile',
    terms: 'https://www.pexels.com/license/',
  },
  fallback: {
    required: true,
    format: 'html',
    display: 'Attribution provided with each image',
    terms: 'Various (check individual image attributions)',
  },
} as const;

/**
 * Helper function to build attribution string for Unsplash
 */
export function buildUnsplashAttribution(
  photographerName: string,
  photographerUrl: string
): string {
  return `Photo by <a href="${photographerUrl}?utm_source=GladysTravelAI&utm_medium=referral" target="_blank" rel="noopener noreferrer" class="hover:underline">${photographerName}</a> on <a href="https://unsplash.com?utm_source=GladysTravelAI&utm_medium=referral" target="_blank" rel="noopener noreferrer" class="hover:underline">Unsplash</a>`;
}

/**
 * Helper function to build attribution string for Pexels
 */
export function buildPexelsAttribution(
  photographerName: string,
  photographerUrl: string
): string {
  return `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer" class="hover:underline">${photographerName}</a> on <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" class="hover:underline">Pexels</a>`;
}

/**
 * Parse photographer name from attribution HTML
 * Useful for display purposes
 */
export function parsePhotographerName(attribution: string): string | null {
  const match = attribution.match(/(?:Photo by|by)\s+<a[^>]*>([^<]+)<\/a>/i);
  return match ? match[1] : null;
}