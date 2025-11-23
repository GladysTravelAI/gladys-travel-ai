
/**
 * Represents an image from any source (Google Places, Unsplash, Pexels, etc.)
 */
export interface PlaceImage {
  /**
   * The final, usable URL for the image.
   * This can be placed directly into an <img src> tag.
   */
  url: string;

  /**
   * The HTML attribution string required by Google, Unsplash, or Pexels.
   * You MUST display this next to the image, as per their terms of service.
   * Example: <span dangerouslySetInnerHTML={{ __html: image.attributions }} />
   */
  attributions: string;

  /**
   * Optional: Source of the image
   */
  source?: 'google_places' | 'unsplash' | 'pexels' | 'fallback';
}

/**
 * Response from /api/images endpoint
 */
export interface ImagesApiResponse {
  images: string[];
  source: 'google_places' | 'unsplash' | 'pexels' | 'fallback' | 'none';
  count: number;
  note?: string;
  error?: string;
}

/**
 * Defines the error response from our /api/images endpoint.
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Request body for /api/images endpoint
 */
export interface ImagesApiRequest {
  destination: string;
}

/**
 * Google Places Photo Reference (for advanced usage)
 */
export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}