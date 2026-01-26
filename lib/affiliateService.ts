// lib/affiliateService.ts
/**
 * Affiliate Service
 * Manages affiliate partner integrations, tracking, and commission calculations
 */

export interface AffiliatePartner {
  id: string;
  name: string;
  category: 'tickets' | 'flights' | 'hotels' | 'restaurants' | 'activities' | 'insurance';
  baseUrl: string;
  affiliateId: string;
  commission: number; // percentage
  logo: string;
  features?: string[];
  active: boolean;
}

export interface AffiliateLink {
  url: string;
  partner: AffiliatePartner;
  productId: string;
  trackingParams: Record<string, string>;
}

export interface AffiliateTransaction {
  id: string;
  userId: string;
  partner: string;
  amount: number;
  commission: number;
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: Date;
  confirmedAt?: Date;
  metadata: Record<string, any>;
}

class AffiliateService {
  private partners: Map<string, AffiliatePartner> = new Map();

  constructor() {
    this.initializePartners();
  }

  private initializePartners() {
    // Ticket Partners
    this.addPartner({
      id: 'ticketmaster',
      name: 'Ticketmaster',
      category: 'tickets',
      baseUrl: 'https://www.ticketmaster.com',
      affiliateId: process.env.NEXT_PUBLIC_TICKETMASTER_AFFILIATE_ID || 'TM_AFFILIATE',
      commission: 5,
      logo: '🎫',
      features: ['Official', 'Verified', 'Mobile tickets', 'Fan protection'],
      active: true
    });

    this.addPartner({
      id: 'stubhub',
      name: 'StubHub',
      category: 'tickets',
      baseUrl: 'https://www.stubhub.com',
      affiliateId: process.env.NEXT_PUBLIC_STUBHUB_AFFILIATE_ID || 'SH_AFFILIATE',
      commission: 8,
      logo: '🎟️',
      features: ['FanProtect™', 'Price match', 'Mobile app', 'Last minute deals'],
      active: true
    });

    this.addPartner({
      id: 'seatgeek',
      name: 'SeatGeek',
      category: 'tickets',
      baseUrl: 'https://seatgeek.com',
      affiliateId: process.env.NEXT_PUBLIC_SEATGEEK_AFFILIATE_ID || 'SG_AFFILIATE',
      commission: 6,
      logo: '💺',
      features: ['Deal Score', 'Interactive maps', 'Best value', 'Mobile entry'],
      active: true
    });

    this.addPartner({
      id: 'vividseats',
      name: 'Vivid Seats',
      category: 'tickets',
      baseUrl: 'https://www.vividseats.com',
      affiliateId: process.env.NEXT_PUBLIC_VIVID_AFFILIATE_ID || 'VS_AFFILIATE',
      commission: 7,
      logo: '✨',
      features: ['100% Buyer Guarantee', 'Rewards program', 'VIP packages', 'Group deals'],
      active: true
    });

    // Flight Partners
    this.addPartner({
      id: 'skyscanner',
      name: 'Skyscanner',
      category: 'flights',
      baseUrl: 'https://www.skyscanner.com',
      affiliateId: process.env.NEXT_PUBLIC_SKYSCANNER_AFFILIATE_ID || 'SKY_AFFILIATE',
      commission: 3,
      logo: '✈️',
      active: true
    });

    this.addPartner({
      id: 'kayak',
      name: 'KAYAK',
      category: 'flights',
      baseUrl: 'https://www.kayak.com',
      affiliateId: process.env.NEXT_PUBLIC_KAYAK_AFFILIATE_ID || 'KAYAK_AFFILIATE',
      commission: 4,
      logo: '🛫',
      active: true
    });

    this.addPartner({
      id: 'expedia_flights',
      name: 'Expedia Flights',
      category: 'flights',
      baseUrl: 'https://www.expedia.com/Flights',
      affiliateId: process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID || 'EXP_AFFILIATE',
      commission: 5,
      logo: '🌍',
      active: true
    });

    // Hotel Partners
    this.addPartner({
      id: 'booking',
      name: 'Booking.com',
      category: 'hotels',
      baseUrl: 'https://www.booking.com',
      affiliateId: process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || 'BOOKING_AFFILIATE',
      commission: 4,
      logo: '🏨',
      features: ['Free cancellation', 'No booking fees', 'Price match'],
      active: true
    });

    this.addPartner({
      id: 'hotels',
      name: 'Hotels.com',
      category: 'hotels',
      baseUrl: 'https://www.hotels.com',
      affiliateId: process.env.NEXT_PUBLIC_HOTELS_AFFILIATE_ID || 'HOTELS_AFFILIATE',
      commission: 4.5,
      logo: '🏩',
      features: ['Rewards program', 'Secret prices', 'Mobile-only deals'],
      active: true
    });

    this.addPartner({
      id: 'airbnb',
      name: 'Airbnb',
      category: 'hotels',
      baseUrl: 'https://www.airbnb.com',
      affiliateId: process.env.NEXT_PUBLIC_AIRBNB_AFFILIATE_ID || 'AIRBNB_AFFILIATE',
      commission: 3,
      logo: '🏠',
      features: ['Unique stays', 'Local experiences', 'Flexible cancellation'],
      active: true
    });

    this.addPartner({
      id: 'expedia_hotels',
      name: 'Expedia Hotels',
      category: 'hotels',
      baseUrl: 'https://www.expedia.com/Hotels',
      affiliateId: process.env.NEXT_PUBLIC_EXPEDIA_AFFILIATE_ID || 'EXP_AFFILIATE',
      commission: 4.5,
      logo: '🏩',
      features: ['Bundle & save', 'Rewards points', 'Member pricing'],
      active: true
    });
  }

  private addPartner(partner: AffiliatePartner) {
    this.partners.set(partner.id, partner);
  }

  /**
   * Get all partners for a specific category
   */
  getPartnersByCategory(category: AffiliatePartner['category']): AffiliatePartner[] {
    return Array.from(this.partners.values())
      .filter(p => p.category === category && p.active);
  }

  /**
   * Get a specific partner by ID
   */
  getPartner(partnerId: string): AffiliatePartner | undefined {
    return this.partners.get(partnerId);
  }

  /**
   * Generate affiliate link with tracking
   */
  generateAffiliateLink(
    partnerId: string,
    productId: string,
    userId?: string,
    additionalParams?: Record<string, string>
  ): AffiliateLink | null {
    const partner = this.partners.get(partnerId);
    if (!partner) return null;

    const trackingParams: Record<string, string> = {
      aid: partner.affiliateId,
      pid: productId,
      ...(userId && { uid: userId }),
      ts: Date.now().toString(),
      ...additionalParams
    };

    // Build URL with tracking params
    const url = new URL(partner.baseUrl);
    Object.entries(trackingParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return {
      url: url.toString(),
      partner,
      productId,
      trackingParams
    };
  }

  /**
   * Calculate commission for a transaction
   */
  calculateCommission(amount: number, partnerId: string): number {
    const partner = this.partners.get(partnerId);
    if (!partner) return 0;

    return (amount * partner.commission) / 100;
  }

  /**
   * Track affiliate click (send to analytics)
   */
  async trackClick(
    partnerId: string,
    productId: string,
    userId?: string
  ): Promise<void> {
    try {
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          productId,
          userId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  }

  /**
   * Track affiliate conversion (successful purchase)
   */
  async trackConversion(
    partnerId: string,
    productId: string,
    amount: number,
    userId?: string
  ): Promise<void> {
    try {
      const commission = this.calculateCommission(amount, partnerId);
      
      await fetch('/api/affiliate/track-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          productId,
          amount,
          commission,
          userId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate conversion:', error);
    }
  }

  /**
   * Get user's affiliate earnings
   */
  async getUserEarnings(userId: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    transactions: AffiliateTransaction[];
  }> {
    try {
      const response = await fetch(`/api/affiliate/earnings?userId=${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch user earnings:', error);
      return { total: 0, pending: 0, paid: 0, transactions: [] };
    }
  }

  /**
   * Compare prices across all partners for a specific product type
   */
  async comparePrices(
    category: AffiliatePartner['category'],
    searchParams: Record<string, any>
  ): Promise<Array<{
    partner: AffiliatePartner;
    price: number;
    fees: number;
    total: number;
    commission: number;
    link: string;
  }>> {
    const partners = this.getPartnersByCategory(category);
    
    // In production, this would make actual API calls to each partner
    // For now, we'll simulate with mock data
    return partners.map(partner => {
      const basePrice = 200 + Math.random() * 100;
      const fees = basePrice * 0.15;
      const total = basePrice + fees;
      const commission = this.calculateCommission(total, partner.id);

      return {
        partner,
        price: Math.round(basePrice),
        fees: Math.round(fees),
        total: Math.round(total),
        commission: Math.round(commission * 100) / 100,
        link: this.generateAffiliateLink(partner.id, searchParams.productId || 'product')?.url || ''
      };
    }).sort((a, b) => a.total - b.total);
  }
}

// Export singleton instance
export const affiliateService = new AffiliateService();