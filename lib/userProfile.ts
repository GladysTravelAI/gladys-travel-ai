// lib/userProfile.ts

import { toast } from 'sonner';

// ── TYPE DEFINITIONS ──────────────────────────────────────────────────────────

export interface UserPreferences {
  // Core Identity
  userId?:       string;
  name?:         string;
  email?:        string;
  profileImage?: string;
  phoneNumber?:  string;
  dateOfBirth?:  string;
  location?:     string;
  homeCity?:     string;  // ← optional, used by GladysCompanion memory injection
  bio?:          string;

  // Travel Style
  preferredTripTypes:   TripType[];
  budgetRange:          BudgetRange;
  preferredActivities:  string[];
  cuisinePreferences:   string[];
  avoidCuisines:        string[];

  // Destinations
  visitedDestinations: VisitedDestination[];
  wishlist:            string[];
  preferredClimate:    ClimateType[];

  // Booking
  preferredHotelTypes: HotelType[];
  preferredAirlines:   string[];
  seatPreference?:     SeatPreference;
  mealPreference?:     string;

  // Group Travel
  typicalGroupSize: number;
  typicalGroupType: GroupType;
  travelingWithKids: boolean;
  kidsAges?:        number[];

  // Interests & Events
  interests:        string[];
  favoriteTeams?:   string[];
  favoriteArtists?: string[];
  upcomingEvents?:  UpcomingEvent[];

  // Learning Data
  searchHistory:  SearchHistoryEntry[];
  bookingHistory: BookingHistoryEntry[];

  // Stats
  totalTripsPlanned:  number;
  totalBookings:      number;
  totalDestinations:  number;
  savedCount?:        number;  // ← optional — saved trips/items count
  totalSpent:         number;
  memberSince:        string;
  lastLogin:          string;

  // Gamification
  status:       UserStatus;
  starRating:   number;
  achievements: Achievement[];
  points:       number;

  // Metadata
  createdAt:  string;
  updatedAt:  string;
  lastActive: string;
  version?:   number;
}

// ── SUB-TYPES ─────────────────────────────────────────────────────────────────

export type TripType      = 'adventure' | 'romantic' | 'cultural' | 'beach' | 'city' | 'nature' | 'luxury' | 'budget';
export type BudgetRange   = 'Budget' | 'Mid-range' | 'Luxury' | 'Ultra-Luxury';
export type ClimateType   = 'tropical' | 'temperate' | 'cold' | 'arid' | 'mediterranean';
export type HotelType     = 'luxury' | 'boutique' | 'hostel' | 'resort' | 'apartment' | 'bed-and-breakfast';
export type SeatPreference = 'window' | 'aisle' | 'middle';
export type GroupType     = 'solo' | 'couple' | 'family' | 'group' | 'business';
export type UserStatus    = 'Newbie' | 'Explorer' | 'Adventurer' | 'Globe Trotter' | 'Travel Legend';
export type EventType     = 'sports' | 'concert' | 'festival' | 'theater' | 'other';
export type BookingType   = 'hotel' | 'flight' | 'restaurant' | 'activity' | 'event';

export interface VisitedDestination {
  city:       string;
  country:    string;
  rating:     number;
  visitDate:  string;
  liked:      string[];
  disliked:   string[];
}

export interface UpcomingEvent {
  name:     string;
  date:     string;
  location: string;
  type:     EventType;
}

export interface SearchHistoryEntry {
  query:          string;
  timestamp:      string;
  resultClicked?: string;
}

export interface BookingHistoryEntry {
  type:         BookingType;
  name:         string;
  price:        number;
  rating?:      number;
  timestamp:    string;
  destination?: string;
}

export interface Achievement {
  id:          string;
  name:        string;
  description: string;
  earnedAt:    string;
  icon?:       string;
}

export interface TripFeedback {
  tripId:      string;
  destination: string;
  startDate:   string;
  endDate:     string;
  overallRating:        number;
  wouldRecommend:       boolean;
  itineraryAccuracy:    number;
  hotelSatisfaction:    number;
  restaurantQuality:    number;
  activitiesEnjoyment:  number;
  valueForMoney:        number;
  highlights:     string[];
  disappointments: string[];
  suggestions:    string;
  usedRecommendations: { hotels: string[]; restaurants: string[]; activities: string[] };
  timestamp: string;
}

export interface PrivacySettings {
  dataCollectionConsent:  boolean;
  marketingConsent:       boolean;
  analyticsConsent:       boolean;
  shareDataWithPartners:  boolean;
  consentDate:            string;
}

// ── PROFILE MANAGER ───────────────────────────────────────────────────────────

export class UserProfileManager {
  private storageKey    = 'gladys_user_profile';
  private imageKey      = 'gladys_profile_image';
  private privacyKey    = 'gladys_privacy_settings';
  private backupKey     = 'gladys_profile_backup';
  private currentVersion = 1;

  private cache         = new Map<string, { profile: UserPreferences; timestamp: number }>();
  private cacheTimeout  = 5 * 60 * 1000;

  // ── Save ──────────────────────────────────────────────────────────────────

  async saveProfile(profile: UserPreferences, showToast = true): Promise<boolean> {
    try {
      const validation = this.validateProfile(profile);
      if (!validation.valid) {
        if (showToast) toast.error('Invalid profile data', { description: validation.errors[0] });
        return false;
      }

      const updatedProfile: UserPreferences = {
        ...profile,
        updatedAt:  new Date().toISOString(),
        lastActive: new Date().toISOString(),
        version:    this.currentVersion,
      };

      const uid        = profile.userId || 'guest';
      const storageKey = `${this.storageKey}_${uid}`;

      await this.createBackup(uid);
      localStorage.setItem(storageKey, JSON.stringify(updatedProfile));

      if (typeof window !== 'undefined' && (window as any).storage) {
        try { await (window as any).storage.set(`user:${uid}`, JSON.stringify(updatedProfile), false); }
        catch { /* local only */ }
      }

      this.cache.set(uid, { profile: updatedProfile, timestamp: Date.now() });

      if (showToast) toast.success('Profile saved', { description: 'Your preferences have been updated' });
      return true;
    } catch {
      if (showToast) toast.error('Save failed', { description: 'Could not save your profile. Please try again.' });
      return false;
    }
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  async loadProfile(userId?: string): Promise<UserPreferences | null> {
    try {
      const uid    = userId || 'guest';
      const cached = this.cache.get(uid);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) return cached.profile;

      if (typeof window !== 'undefined' && (window as any).storage) {
        try {
          const result = await (window as any).storage.get(`user:${uid}`);
          if (result?.value) {
            const p = this.migrateProfileData(JSON.parse(result.value));
            this.cache.set(uid, { profile: p, timestamp: Date.now() });
            return p;
          }
        } catch { /* fall through */ }
      }

      const stored = localStorage.getItem(`${this.storageKey}_${uid}`);
      if (stored) {
        const p = this.migrateProfileData(JSON.parse(stored));
        this.cache.set(uid, { profile: p, timestamp: Date.now() });
        return p;
      }

      return null;
    } catch {
      return null;
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateProfile(userId: string, updates: Partial<UserPreferences>, showToast = true): Promise<boolean> {
    const profile = await this.loadProfile(userId);
    if (!profile) {
      if (showToast) toast.error('Update failed', { description: 'Profile not found' });
      return false;
    }
    return this.saveProfile({ ...profile, ...updates, userId }, showToast);
  }

  async updatePreference(userId: string, key: keyof UserPreferences, value: any): Promise<boolean> {
    return this.updateProfile(userId, { [key]: value } as Partial<UserPreferences>, false);
  }

  // ── Profile image ─────────────────────────────────────────────────────────

  async saveProfileImage(userId: string, imageData: string): Promise<boolean> {
    try {
      localStorage.setItem(`${this.imageKey}_${userId}`, imageData);
      if (typeof window !== 'undefined' && (window as any).storage) {
        try { await (window as any).storage.set(`user_image:${userId}`, imageData, false); } catch { /* local only */ }
      }
      await this.updatePreference(userId, 'profileImage', imageData);
      toast.success('Image updated', { description: 'Your profile picture has been saved' });
      return true;
    } catch {
      toast.error('Image upload failed');
      return false;
    }
  }

  async loadProfileImage(userId: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && (window as any).storage) {
        try {
          const r = await (window as any).storage.get(`user_image:${userId}`);
          if (r?.value) return r.value;
        } catch { /* fall through */ }
      }
      return localStorage.getItem(`${this.imageKey}_${userId}`);
    } catch { return null; }
  }

  // ── Tracking ──────────────────────────────────────────────────────────────

  async trackSearch(userId: string, query: string, resultClicked?: string): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    profile.searchHistory.push({ query, timestamp: new Date().toISOString(), resultClicked });
    if (profile.searchHistory.length > 100) profile.searchHistory = profile.searchHistory.slice(-100);
    await this.saveProfile(profile, false);
  }

  async trackBooking(userId: string, booking: Omit<BookingHistoryEntry, 'timestamp'>): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    profile.bookingHistory.push({ ...booking, timestamp: new Date().toISOString() });
    profile.totalBookings += 1;
    profile.totalSpent    += booking.price;
    profile.status        = this.calculateStatus(profile);
    profile.starRating    = this.calculateStarRating(profile);
    const newAchievements = this.checkAchievements(profile);
    if (newAchievements.length > 0) {
      profile.achievements.push(...newAchievements);
      newAchievements.forEach(a => toast.success('🏆 Achievement Unlocked!', { description: a.name }));
    }
    await this.saveProfile(profile, false);
    toast.success('Booking recorded!', { description: `${booking.name} added to your history` });
  }

  async trackTripPlanned(userId: string, destination: string): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    profile.totalTripsPlanned += 1;
    const exists = profile.visitedDestinations.some(d => d.city === destination || d.country === destination);
    if (!exists) profile.totalDestinations += 1;
    profile.status     = this.calculateStatus(profile);
    profile.starRating = this.calculateStarRating(profile);
    profile.points    += 10;
    await this.saveProfile(profile, false);
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  async saveFeedback(userId: string, feedback: TripFeedback): Promise<boolean> {
    try {
      const key = `trip_feedback_${userId}_${feedback.tripId}`;
      localStorage.setItem(key, JSON.stringify(feedback));
      if (typeof window !== 'undefined' && (window as any).storage) {
        try { await (window as any).storage.set(key, JSON.stringify(feedback), false); } catch { /* local only */ }
      }
      await this.updateProfileFromFeedback(userId, feedback);
      toast.success('Thank you!', { description: 'Your feedback helps us improve your experience' });
      return true;
    } catch {
      toast.error('Feedback failed');
      return false;
    }
  }

  private async updateProfileFromFeedback(userId: string, feedback: TripFeedback): Promise<void> {
    const profile = await this.loadProfile(userId);
    if (!profile) return;
    profile.visitedDestinations.push({
      city: feedback.destination, country: '',
      rating: feedback.overallRating, visitDate: feedback.startDate,
      liked: feedback.highlights, disliked: feedback.disappointments,
    });
    profile.points += 50;
    await this.saveProfile(profile, false);
  }

  // ── Gamification ──────────────────────────────────────────────────────────

  private calculateStatus(profile: UserPreferences): UserStatus {
    const t = profile.totalTripsPlanned, d = profile.totalDestinations;
    if (t >= 50 || d >= 20) return 'Travel Legend';
    if (t >= 30 || d >= 15) return 'Globe Trotter';
    if (t >= 15 || d >= 8)  return 'Adventurer';
    if (t >= 5  || d >= 3)  return 'Explorer';
    return 'Newbie';
  }

  private calculateStarRating(profile: UserPreferences): number {
    const score = profile.totalTripsPlanned * 2 + profile.totalDestinations * 3 + profile.totalBookings;
    if (score >= 100) return 5;
    if (score >= 60)  return 4;
    if (score >= 30)  return 3;
    if (score >= 10)  return 2;
    return 1;
  }

  private checkAchievements(profile: UserPreferences): Achievement[] {
    const newOnes: Achievement[] = [];
    const existing = new Set(profile.achievements.map(a => a.id));
    const check = (id: string, name: string, description: string, icon: string, condition: boolean) => {
      if (condition && !existing.has(id)) newOnes.push({ id, name, description, icon, earnedAt: new Date().toISOString() });
    };
    check('first_booking',     'First Steps',         'Made your first booking!',         '🎉', profile.totalBookings === 1);
    check('ten_bookings',      'Frequent Traveler',   'Completed 10 bookings!',           '✈️', profile.totalBookings === 10);
    check('ten_destinations',  'Globe Trotter',       'Visited 10 different destinations!','🌍', profile.totalDestinations === 10);
    check('big_spender',       'Adventure Investor',  'Spent $10,000 on travel!',         '💰', profile.totalSpent >= 10000);
    return newOnes;
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  getRecommendations(profile: UserPreferences, destination: string) {
    const result = { suggestedActivities: [] as string[], suggestedRestaurants: [] as string[], tripTips: [] as string[] };
    if (profile.preferredTripTypes.includes('adventure')) result.suggestedActivities.push('hiking', 'zip-lining', 'rock climbing');
    if (profile.preferredTripTypes.includes('cultural'))  result.suggestedActivities.push('museums', 'historical tours', 'art galleries');
    if (profile.preferredTripTypes.includes('beach'))     result.suggestedActivities.push('snorkeling', 'beach volleyball', 'sunset cruise');
    result.suggestedRestaurants = profile.cuisinePreferences.slice(0, 5);
    const similar = profile.visitedDestinations.filter(v => v.city === destination || v.country === destination);
    if (similar.length > 0 && similar[similar.length - 1].liked.length > 0)
      result.tripTips.push(`Based on your past trips, you loved: ${similar[similar.length - 1].liked.slice(0, 2).join(', ')}`);
    if (profile.travelingWithKids) result.tripTips.push('Kid-friendly activities prioritized');
    if (profile.budgetRange === 'Luxury' || profile.budgetRange === 'Ultra-Luxury') result.tripTips.push('Premium experiences recommended');
    return result;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validateProfile(profile: UserPreferences): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.push('Invalid email format');
    if (profile.starRating && (profile.starRating < 1 || profile.starRating > 5)) errors.push('Star rating must be between 1 and 5');
    const validBudgets: BudgetRange[] = ['Budget', 'Mid-range', 'Luxury', 'Ultra-Luxury'];
    if (!validBudgets.includes(profile.budgetRange)) errors.push('Invalid budget range');
    if (profile.dateOfBirth) { const d = new Date(profile.dateOfBirth); if (isNaN(d.getTime())) errors.push('Invalid date of birth'); }
    return { valid: errors.length === 0, errors };
  }

  // ── Migration ─────────────────────────────────────────────────────────────

  private migrateProfileData(profile: any): UserPreferences {
    if ((profile.version ?? 0) < this.currentVersion) {
      profile.version = this.currentVersion;
      // Ensure all array fields exist (for old profiles missing them)
      profile.searchHistory       = profile.searchHistory       ?? [];
      profile.bookingHistory      = profile.bookingHistory      ?? [];
      profile.visitedDestinations = profile.visitedDestinations ?? [];
      profile.achievements        = profile.achievements        ?? [];
      profile.preferredTripTypes  = profile.preferredTripTypes  ?? [];
      profile.preferredActivities = profile.preferredActivities ?? [];
      profile.cuisinePreferences  = profile.cuisinePreferences  ?? [];
      profile.avoidCuisines       = profile.avoidCuisines       ?? [];
      profile.wishlist            = profile.wishlist            ?? [];
      profile.preferredClimate    = profile.preferredClimate    ?? [];
      profile.preferredHotelTypes = profile.preferredHotelTypes ?? [];
      profile.preferredAirlines   = profile.preferredAirlines   ?? [];
      profile.interests           = profile.interests           ?? [];
    }
    return profile;
  }

  // ── Backup & recovery ─────────────────────────────────────────────────────

  private async createBackup(userId: string): Promise<void> {
    try {
      const profile = await this.loadProfile(userId);
      if (!profile) return;
      localStorage.setItem(`${this.backupKey}_${userId}`, JSON.stringify({ profile, timestamp: new Date().toISOString() }));
    } catch { /* silent */ }
  }

  async restoreFromBackup(userId: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(`${this.backupKey}_${userId}`);
      if (!stored) { toast.error('No backup found'); return false; }
      const backup = JSON.parse(stored);
      await this.saveProfile(backup.profile);
      toast.success('Profile restored', { description: `Restored from ${new Date(backup.timestamp).toLocaleString()}` });
      return true;
    } catch {
      toast.error('Restore failed');
      return false;
    }
  }

  // ── Import / export ───────────────────────────────────────────────────────

  async exportProfile(userId: string): Promise<string> {
    const profile = await this.loadProfile(userId);
    if (!profile) throw new Error('Profile not found');
    return JSON.stringify(profile, null, 2);
  }

  async importProfile(userId: string, profileData: string): Promise<boolean> {
    try {
      const profile = JSON.parse(profileData);
      profile.userId    = userId;
      profile.updatedAt = new Date().toISOString();
      return this.saveProfile(profile);
    } catch {
      toast.error('Import failed', { description: 'Invalid profile data format' });
      return false;
    }
  }

  // ── Privacy / GDPR ────────────────────────────────────────────────────────

  async savePrivacySettings(userId: string, settings: PrivacySettings): Promise<boolean> {
    try {
      localStorage.setItem(`${this.privacyKey}_${userId}`, JSON.stringify(settings));
      toast.success('Privacy updated');
      return true;
    } catch { return false; }
  }

  async loadPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const stored = localStorage.getItem(`${this.privacyKey}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  async deleteAllUserData(userId: string): Promise<boolean> {
    try {
      ['storageKey', 'imageKey', 'privacyKey', 'backupKey'].forEach(k =>
        localStorage.removeItem(`${(this as any)[k]}_${userId}`)
      );
      if (typeof window !== 'undefined' && (window as any).storage) {
        try {
          await (window as any).storage.delete(`user:${userId}`);
          await (window as any).storage.delete(`user_image:${userId}`);
        } catch { /* local only */ }
      }
      this.cache.delete(userId);
      toast.success('Data deleted', { description: 'All your data has been permanently deleted' });
      return true;
    } catch {
      toast.error('Deletion failed');
      return false;
    }
  }

  clearCache(userId?: string): void {
    userId ? this.cache.delete(userId) : this.cache.clear();
  }
}

// ── SINGLETON ─────────────────────────────────────────────────────────────────

export const profileManager = new UserProfileManager();

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function createDefaultProfile(userId?: string, email?: string, name?: string): UserPreferences {
  const now = new Date().toISOString();
  return {
    userId,
    name:          name  || 'Traveler',
    email:         email || '',
    homeCity:      '',
    preferredTripTypes:   [],
    budgetRange:          'Mid-range',
    preferredActivities:  [],
    cuisinePreferences:   [],
    avoidCuisines:        [],
    visitedDestinations:  [],
    wishlist:             [],
    preferredClimate:     [],
    preferredHotelTypes:  [],
    preferredAirlines:    [],
    typicalGroupSize:     1,
    typicalGroupType:     'solo',
    travelingWithKids:    false,
    interests:            [],
    searchHistory:        [],
    bookingHistory:       [],
    totalTripsPlanned:    0,
    totalBookings:        0,
    totalDestinations:    0,
    savedCount:           0,
    totalSpent:           0,
    memberSince:          now,
    lastLogin:            now,
    status:               'Newbie',
    starRating:           1,
    achievements:         [],
    points:               0,
    createdAt:            now,
    updatedAt:            now,
    lastActive:           now,
    version:              1,
  };
}

export function getUpcomingTrips(profile: UserPreferences): number {
  const now = new Date();
  return profile.bookingHistory.filter(b => new Date(b.timestamp) > now).length;
}

export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

export function getPointsToNextLevel(points: number): number {
  return getUserLevel(points) * 100 - points;
}