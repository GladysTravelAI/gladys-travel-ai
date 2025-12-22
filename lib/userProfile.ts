// lib/userProfile.ts - Enhanced User Profiling with Persistent Storage

export interface UserPreferences {
  userId?: string;
  name?: string;
  email?: string;
  profileImage?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  
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
    destination?: string;
  }>;
  
  // Stats
  totalTripsPlanned: number;
  totalBookings: number;
  totalDestinations: number;
  totalSpent: number;
  memberSince: string;
  lastLogin: string;
  
  // Gamification
  status: 'Newbie' | 'Explorer' | 'Adventurer' | 'Globe Trotter' | 'Travel Legend';
  starRating: number; // 1-5
  achievements: string[];
  points: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastActive: string;
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

// Enhanced Storage interface with cloud sync capability
export class UserProfileManager {
  private storageKey = 'gladys_user_profile';
  private imageKey = 'gladys_profile_image';
  
  // Save user profile to storage
  async saveProfile(profile: UserPreferences): Promise<boolean> {
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      localStorage.setItem(
        `${this.storageKey}_${profile.userId || 'guest'}`, 
        JSON.stringify(updatedProfile)
      );
      
      // Also save to window.storage if available (for persistence across sessions)
      if (typeof window !== 'undefined' && (window as any).storage) {
        await (window as any).storage.set(
          `user:${profile.userId || 'guest'}`,
          JSON.stringify(updatedProfile)
        );
      }
      
      return true;
    } catch (error) {
      console.error("Failed to save profile:", error);
      return false;
    }
  }
  
  // Load user profile from storage
  async loadProfile(userId?: string): Promise<UserPreferences | null> {
    try {
      const uid = userId || 'guest';
      
      // Try window.storage first (persistent across sessions)
      if (typeof window !== 'undefined' && (window as any).storage) {
        try {
          const result = await (window as any).storage.get(`user:${uid}`);
          if (result && result.value) {
            return JSON.parse(result.value);
          }
        } catch (e) {
          // Fallback to localStorage
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(`${this.storageKey}_${uid}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return null;
    } catch (error) {
      console.error("Failed to load profile:", error);
      return null;
    }
  }
  
  // Save profile image
  async saveProfileImage(userId: string, imageData: string): Promise<boolean> {
    try {
      localStorage.setItem(`${this.imageKey}_${userId}`, imageData);
      
      if (typeof window !== 'undefined' && (window as any).storage) {
        await (window as any).storage.set(`user_image:${userId}`, imageData);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to save profile image:", error);
      return false;
    }
  }
  
  // Load profile image
  async loadProfileImage(userId: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && (window as any).storage) {
        try {
          const result = await (window as any).storage.get(`user_image:${userId}`);
          if (result && result.value) {
            return result.value;
          }
        } catch (e) {
          // Fallback to localStorage
        }
      }
      
      return localStorage.getItem(`${this.imageKey}_${userId}`);
    } catch (error) {
      console.error("Failed to load profile image:", error);
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
  
  // Update multiple fields at once
  async updateProfile(userId: string, updates: Partial<UserPreferences>): Promise<boolean> {
    const profile = await this.loadProfile(userId);
    if (!profile) return false;
    
    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.saveProfile(updatedProfile);
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
    
    profile.bookingHistory.push({
      ...booking,
      timestamp: new Date().toISOString()
    });
    profile.totalBookings += 1;
    profile.totalSpent += booking.price;
    
    // Update status based on bookings
    profile.status = this.calculateStatus(profile);
    profile.starRating = this.calculateStarRating(profile);
    
    await this.saveProfile(profile);
  }
  
  // Track trip planning
  async trackTripPlanned(userId: string, destination: string): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    
    profile.totalTripsPlanned += 1;
    
    // Add to destinations if new
    const existingDest = profile.visitedDestinations.find(d => 
      d.city === destination || d.country === destination
    );
    
    if (!existingDest) {
      profile.totalDestinations += 1;
    }
    
    // Update gamification
    profile.status = this.calculateStatus(profile);
    profile.starRating = this.calculateStarRating(profile);
    
    await this.saveProfile(profile);
  }
  
  // Calculate user status based on activity
  private calculateStatus(profile: UserPreferences): UserPreferences['status'] {
    const trips = profile.totalTripsPlanned;
    const destinations = profile.totalDestinations;
    
    if (trips >= 50 || destinations >= 20) return 'Travel Legend';
    if (trips >= 30 || destinations >= 15) return 'Globe Trotter';
    if (trips >= 15 || destinations >= 8) return 'Adventurer';
    if (trips >= 5 || destinations >= 3) return 'Explorer';
    return 'Newbie';
  }
  
  // Calculate star rating based on activity
  private calculateStarRating(profile: UserPreferences): number {
    const trips = profile.totalTripsPlanned;
    const destinations = profile.totalDestinations;
    const bookings = profile.totalBookings;
    
    const score = trips * 2 + destinations * 3 + bookings * 1;
    
    if (score >= 100) return 5;
    if (score >= 60) return 4;
    if (score >= 30) return 3;
    if (score >= 10) return 2;
    return 1;
  }
  
  // Save trip feedback
  async saveFeedback(userId: string, feedback: TripFeedback): Promise<boolean> {
    try {
      const feedbackKey = `trip_feedback_${userId}_${feedback.tripId}`;
      localStorage.setItem(feedbackKey, JSON.stringify(feedback));
      
      if (typeof window !== 'undefined' && (window as any).storage) {
        await (window as any).storage.set(feedbackKey, JSON.stringify(feedback));
      }
      
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
    if (profile.preferredTripTypes.includes('beach')) {
      recommendations.suggestedActivities.push('snorkeling', 'beach volleyball', 'sunset cruise');
    }
    
    // Suggest restaurants based on cuisine preferences
    recommendations.suggestedRestaurants = profile.cuisinePreferences.slice(0, 5);
    
    // Generate tips based on past experiences
    const similarVisits = profile.visitedDestinations.filter(v => 
      v.country === destination || v.city === destination
    );
    
    if (similarVisits.length > 0) {
      const lastVisit = similarVisits[similarVisits.length - 1];
      if (lastVisit.liked.length > 0) {
        recommendations.tripTips.push(`Based on your past trips, you loved: ${lastVisit.liked.slice(0, 2).join(', ')}`);
      }
    }
    
    if (profile.travelingWithKids) {
      recommendations.tripTips.push('Kid-friendly activities prioritized based on your family profile');
    }
    
    if (profile.budgetRange === 'Luxury') {
      recommendations.tripTips.push('Premium accommodations and experiences recommended');
    }
    
    return recommendations;
  }
  
  // Export profile data
  async exportProfile(userId: string): Promise<string> {
    const profile = await this.loadProfile(userId);
    return JSON.stringify(profile, null, 2);
  }
  
  // Import profile data
  async importProfile(userId: string, profileData: string): Promise<boolean> {
    try {
      const profile = JSON.parse(profileData);
      profile.userId = userId;
      return await this.saveProfile(profile);
    } catch (error) {
      console.error("Failed to import profile:", error);
      return false;
    }
  }
  
  // Delete profile
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`${this.storageKey}_${userId}`);
      localStorage.removeItem(`${this.imageKey}_${userId}`);
      
      if (typeof window !== 'undefined' && (window as any).storage) {
        await (window as any).storage.delete(`user:${userId}`);
        await (window as any).storage.delete(`user_image:${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete profile:", error);
      return false;
    }
  }
}

// Singleton instance
export const profileManager = new UserProfileManager();

// Helper: Initialize new user profile
export function createDefaultProfile(userId?: string, email?: string, name?: string): UserPreferences {
  return {
    userId,
    name: name || 'Traveler',
    email: email || '',
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
    totalTripsPlanned: 0,
    totalBookings: 0,
    totalDestinations: 0,
    totalSpent: 0,
    memberSince: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: 'Explorer',
    starRating: 3,
    achievements: [],
    points: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
}

// Helper: Calculate upcoming trips from bookings
export function getUpcomingTrips(profile: UserPreferences): number {
  const now = new Date();
  return profile.bookingHistory.filter(booking => {
    const bookingDate = new Date(booking.timestamp);
    return bookingDate > now;
  }).length;
}