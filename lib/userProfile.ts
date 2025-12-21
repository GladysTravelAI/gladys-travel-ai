// lib/userProfile.ts - User Profiling & Learning System

export interface UserPreferences {
  userId?: string;
  name?: string;
  email?: string;
  
  // Travel Style Preferences
  preferredTripTypes: string[]; // adventure, romantic, cultural, etc.
  budgetRange: 'Budget' | 'Mid-range' | 'Luxury';
  preferredActivities: string[]; // hiking, museums, beaches, etc.
  cuisinePreferences: string[]; // Italian, Japanese, Street food, etc.
  avoidCuisines: string[]; // Dietary restrictions
  
  // Destination Preferences
  visitedDestinations: Array<{
    city: string;
    country: string;
    rating: number; // 1-5
    visitDate: string;
    liked: string[]; // What they liked
    disliked: string[]; // What they didn't like
  }>;
  wishlist: string[]; // Cities they want to visit
  preferredClimate: string[]; // tropical, temperate, cold, etc.
  
  // Booking Preferences
  preferredHotelTypes: string[]; // luxury, boutique, hostel, etc.
  preferredAirlines: string[];
  seatPreference?: 'window' | 'aisle' | 'middle';
  mealPreference?: string;
  
  // Group Travel
  typicalGroupSize: number;
  typicalGroupType: 'solo' | 'couple' | 'family' | 'group';
  travelingWithKids: boolean;
  kidsAges?: number[];
  
  // Interests & Events
  interests: string[]; // sports, music, art, history, etc.
  favoriteTeams?: string[]; // For sports events
  favoriteArtists?: string[]; // For concerts
  upcomingEvents?: Array<{
    name: string;
    date: string;
    location: string;
    type: 'sports' | 'concert' | 'festival' | 'other';
  }>;
  
  // Learning Data
  searchHistory: Array<{
    query: string;
    timestamp: string;
    resultClicked?: string;
  }>;
  bookingHistory: Array<{
    type: 'hotel' | 'flight' | 'restaurant' | 'activity';
    name: string;
    price: number;
    rating?: number;
    timestamp: string;
  }>;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastActive: string;
  totalTripsPlanned: number;
  totalBookings: number;
}

export interface TripFeedback {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  
  // Overall Experience
  overallRating: number; // 1-5
  wouldRecommend: boolean;
  
  // Specific Ratings
  itineraryAccuracy: number; // 1-5
  hotelSatisfaction: number; // 1-5
  restaurantQuality: number; // 1-5
  activitiesEnjoyment: number; // 1-5
  valueForMoney: number; // 1-5
  
  // Detailed Feedback
  highlights: string[]; // What went well
  disappointments: string[]; // What didn't work
  suggestions: string; // Free text
  
  // Used Items
  usedRecommendations: {
    hotels: string[];
    restaurants: string[];
    activities: string[];
  };
  
  timestamp: string;
}

// Storage interface (can be adapted to any backend)
export class UserProfileManager {
  
  // Save user profile to database
  async saveProfile(profile: UserPreferences): Promise<boolean> {
    try {
      // For now, use localStorage (replace with your database)
      localStorage.setItem(`user_profile_${profile.userId || 'guest'}`, JSON.stringify({
        ...profile,
        updatedAt: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error("Failed to save profile:", error);
      return false;
    }
  }
  
  // Load user profile from database
  async loadProfile(userId?: string): Promise<UserPreferences | null> {
    try {
      const stored = localStorage.getItem(`user_profile_${userId || 'guest'}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error("Failed to load profile:", error);
      return null;
    }
  }
  
  // Update specific preference
  async updatePreference(userId: string, key: keyof UserPreferences, value: any): Promise<boolean> {
    const profile = await this.loadProfile(userId);
    if (!profile) return false;
    
    (profile as any)[key] = value;
    return this.saveProfile(profile);
  }
  
  // Track search behavior
  async trackSearch(userId: string, query: string, resultClicked?: string): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    
    profile.searchHistory.push({
      query,
      timestamp: new Date().toISOString(),
      resultClicked
    });
    
    // Keep only last 100 searches
    if (profile.searchHistory.length > 100) {
      profile.searchHistory = profile.searchHistory.slice(-100);
    }
    
    await this.saveProfile(profile);
  }
  
  // Track booking
  async trackBooking(userId: string, booking: UserPreferences['bookingHistory'][0]): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    
    profile.bookingHistory.push(booking);
    profile.totalBookings += 1;
    
    await this.saveProfile(profile);
  }
  
  // Save trip feedback
  async saveFeedback(userId: string, feedback: TripFeedback): Promise<boolean> {
    try {
      const feedbackKey = `trip_feedback_${userId}_${feedback.tripId}`;
      localStorage.setItem(feedbackKey, JSON.stringify(feedback));
      
      // Update user profile with learnings
      await this.updateProfileFromFeedback(userId, feedback);
      
      return true;
    } catch (error) {
      console.error("Failed to save feedback:", error);
      return false;
    }
  }
  
  // Learn from feedback and update preferences
  private async updateProfileFromFeedback(userId: string, feedback: TripFeedback): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    
    // Add to visited destinations
    profile.visitedDestinations.push({
      city: feedback.destination,
      country: '', // Extract from destination if needed
      rating: feedback.overallRating,
      visitDate: feedback.startDate,
      liked: feedback.highlights,
      disliked: feedback.disappointments
    });
    
    // Update preferences based on ratings
    if (feedback.hotelSatisfaction >= 4) {
      // Learn from highly rated hotels
      feedback.usedRecommendations.hotels.forEach(hotel => {
        // Could extract hotel type and add to preferred types
      });
    }
    
    await this.saveProfile(profile);
  }
  
  // Get personalized recommendations based on profile
  getRecommendations(profile: UserPreferences, destination: string): {
    suggestedActivities: string[];
    suggestedRestaurants: string[];
    tripTips: string[];
  } {
    const recommendations = {
      suggestedActivities: [] as string[],
      suggestedRestaurants: [] as string[],
      tripTips: [] as string[]
    };
    
    // Suggest activities based on preferred trip types
    if (profile.preferredTripTypes.includes('adventure')) {
      recommendations.suggestedActivities.push('hiking', 'zip-lining', 'rock climbing');
    }
    if (profile.preferredTripTypes.includes('cultural')) {
      recommendations.suggestedActivities.push('museums', 'historical tours', 'art galleries');
    }
    
    // Suggest restaurants based on cuisine preferences
    recommendations.suggestedRestaurants = profile.cuisinePreferences.slice(0, 3);
    
    // Generate tips based on past experiences
    const similarVisits = profile.visitedDestinations.filter(v => 
      v.country === destination || v.city === destination
    );
    
    if (similarVisits.length > 0) {
      recommendations.tripTips.push(`Based on your past trips, you loved: ${similarVisits[0].liked.join(', ')}`);
    }
    
    if (profile.travelingWithKids) {
      recommendations.tripTips.push('Kid-friendly activities prioritized based on your family profile');
    }
    
    return recommendations;
  }
  
  // Collaborative filtering: Find similar users
  async findSimilarUsers(profile: UserPreferences, limit: number = 5): Promise<string[]> {
    // This would query your database for users with similar preferences
    // For now, return empty array (implement with real database)
    return [];
  }
  
  // Get recommendations based on similar users
  async getCollaborativeRecommendations(userId: string, destination: string): Promise<{
    hotels: string[];
    restaurants: string[];
    activities: string[];
  }> {
    const profile = await this.loadProfile(userId);
    if (!profile) return { hotels: [], restaurants: [], activities: [] };
    
    const similarUsers = await this.findSimilarUsers(profile);
    
    // In a real implementation, fetch what similar users liked
    // For now, return empty
    return {
      hotels: [],
      restaurants: [],
      activities: []
    };
  }
}

// Singleton instance
export const profileManager = new UserProfileManager();

// Helper: Initialize new user profile
export function createDefaultProfile(userId?: string): UserPreferences {
  return {
    userId,
    preferredTripTypes: [],
    budgetRange: 'Mid-range',
    preferredActivities: [],
    cuisinePreferences: [],
    avoidCuisines: [],
    visitedDestinations: [],
    wishlist: [],
    preferredClimate: [],
    preferredHotelTypes: [],
    preferredAirlines: [],
    typicalGroupSize: 1,
    typicalGroupType: 'solo',
    travelingWithKids: false,
    interests: [],
    searchHistory: [],
    bookingHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalTripsPlanned: 0,
    totalBookings: 0
  };
}