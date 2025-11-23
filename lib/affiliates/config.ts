// lib/affiliates/config.ts
// Centralized affiliate configuration for GladysTravelAI

export interface AffiliateConfig {
  enabled: boolean;
  affiliateId: string;
  commissionRate: number; // Percentage
  trackingEnabled: boolean;
}

export interface AffiliateLinks {
  flights: AffiliateConfig;
  hotels: AffiliateConfig;
  activities: AffiliateConfig;
  dining: AffiliateConfig;
}

// 🔧 CONFIGURE YOUR AFFILIATE IDs HERE
export const AFFILIATE_CONFIG: AffiliateLinks = {
  flights: {
    enabled: true,
    affiliateId: 'YOUR_SKYSCANNER_AFFILIATE_ID', // Replace with your Skyscanner ID
    commissionRate: 0.02, // 2% average (varies by click)
    trackingEnabled: true
  },
  hotels: {
    enabled: true,
    affiliateId: 'YOUR_BOOKING_COM_AID', // Replace with your Booking.com AID
    commissionRate: 4.0, // 4% of hotel price
    trackingEnabled: true
  },
  activities: {
    enabled: true,
    affiliateId: 'YOUR_VIATOR_AFFILIATE_ID', // Replace with your Viator ID
    commissionRate: 8.0, // 8% of activity price
    trackingEnabled: true
  },
  dining: {
    enabled: false, // Enable when you have OpenTable partnership
    affiliateId: '',
    commissionRate: 0,
    trackingEnabled: false
  }
};

// 💰 Revenue estimation helpers
export const estimateCommission = {
  flight: (price: number) => price * AFFILIATE_CONFIG.flights.commissionRate,
  hotel: (price: number) => price * (AFFILIATE_CONFIG.hotels.commissionRate / 100),
  activity: (price: number) => price * (AFFILIATE_CONFIG.activities.commissionRate / 100),
};

// 📊 Track affiliate clicks (optional analytics)
export const trackAffiliateClick = async (
  type: 'flight' | 'hotel' | 'activity',
  itemId: string,
  estimatedValue: number
) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Send to your analytics endpoint
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        itemId,
        estimatedValue,
        estimatedCommission: estimateCommission[type](estimatedValue),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
};