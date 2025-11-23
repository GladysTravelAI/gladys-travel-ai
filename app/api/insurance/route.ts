import { NextResponse } from "next/server";

// Insurance affiliate partners (no license required)
const INSURANCE_PARTNERS = [
  {
    id: "travelguard",
    name: "Travel Guard",
    provider: "AIG",
    logo: "/images/insurance/travelguard.png",
    affiliateBaseUrl: "https://www.travelguard.com/agentlink?ta=GLADYSTRAVEL&utm_source=gladystravelai",
    rating: 4.7,
    reviewCount: 12500,
    highlights: [
      "24/7 Travel Assistance",
      "Cancel For Any Reason available",
      "Coverage for 150+ countries"
    ]
  },
  {
    id: "travelinsurance",
    name: "TravelInsurance.com",
    provider: "TravelInsurance.com",
    logo: "/images/insurance/travelinsurance.png",
    affiliateBaseUrl: "https://www.travelinsurance.com/?aid=GLADYSTRAVEL&utm_source=gladystravelai",
    rating: 4.6,
    reviewCount: 8900,
    highlights: [
      "Compare 20+ providers",
      "Best price guarantee",
      "Free quote in minutes"
    ]
  },
  {
    id: "worldnomads",
    name: "World Nomads",
    provider: "World Nomads",
    logo: "/images/insurance/worldnomads.png",
    affiliateBaseUrl: "https://www.worldnomads.com/travel-insurance/?affiliate=gladystravelai",
    rating: 4.5,
    reviewCount: 15200,
    highlights: [
      "Adventure activities covered",
      "Buy while traveling",
      "Trusted by 1M+ travelers"
    ]
  },
  {
    id: "allianz",
    name: "Allianz Travel Insurance",
    provider: "Allianz",
    logo: "/images/insurance/allianz.png",
    affiliateBaseUrl: "https://www.allianztravelinsurance.com/?utm_source=gladystravelai&aid=GLADYS",
    rating: 4.6,
    reviewCount: 22000,
    highlights: [
      "A+ rated company",
      "SmartBenefits included",
      "Easy online claims"
    ]
  }
];

// Coverage types
const COVERAGE_TYPES = {
  basic: {
    name: "Basic",
    description: "Essential coverage for budget travelers",
    includes: ["Trip Cancellation", "Emergency Medical", "Baggage Loss"],
    priceMultiplier: 0.04 // 4% of trip cost
  },
  standard: {
    name: "Standard", 
    description: "Comprehensive coverage for most trips",
    includes: ["Trip Cancellation", "Emergency Medical", "Baggage Loss", "Trip Delay", "Missed Connection"],
    priceMultiplier: 0.06 // 6% of trip cost
  },
  premium: {
    name: "Premium",
    description: "Maximum protection with Cancel For Any Reason",
    includes: ["Cancel For Any Reason", "Emergency Medical", "Baggage Loss", "Trip Delay", "Missed Connection", "Adventure Sports", "Rental Car Damage"],
    priceMultiplier: 0.10 // 10% of trip cost
  }
};

export interface InsuranceQuote {
  id: string;
  partner: typeof INSURANCE_PARTNERS[0];
  coverageType: keyof typeof COVERAGE_TYPES;
  coverage: typeof COVERAGE_TYPES[keyof typeof COVERAGE_TYPES];
  estimatedPrice: string;
  priceValue: number;
  tripDetails: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    tripCost: number;
  };
  affiliateUrl: string;
  features: string[];
}

export async function POST(req: Request) {
  console.log('===== INSURANCE API CALLED =====');
  
  try {
    const { 
      destination,
      startDate,
      endDate,
      travelers = 1,
      tripCost,
      coverageType = "standard"
    } = await req.json();

    // Validation
    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }
    if (!tripCost || tripCost <= 0) {
      return NextResponse.json(
        { error: "Trip cost is required for insurance quotes" },
        { status: 400 }
      );
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 7;

    // Generate quotes from each partner
    const quotes: InsuranceQuote[] = INSURANCE_PARTNERS.map((partner, idx) => {
      const coverage = COVERAGE_TYPES[coverageType as keyof typeof COVERAGE_TYPES] || COVERAGE_TYPES.standard;
      
      // Calculate price with some variation per partner
      const basePrice = tripCost * coverage.priceMultiplier * travelers;
      const variation = 1 + (idx * 0.05 - 0.1); // -10% to +10% variation
      const price = Math.round(basePrice * variation);
      
      // Build affiliate URL with trip parameters
      const affiliateUrl = `${partner.affiliateBaseUrl}&dest=${encodeURIComponent(destination)}&start=${startDate}&end=${endDate}&travelers=${travelers}&cost=${tripCost}`;

      return {
        id: `${partner.id}-${coverageType}`,
        partner,
        coverageType: coverageType as keyof typeof COVERAGE_TYPES,
        coverage,
        estimatedPrice: `$${price}`,
        priceValue: price,
        tripDetails: {
          destination,
          startDate,
          endDate,
          travelers,
          tripCost
        },
        affiliateUrl,
        features: [...partner.highlights, ...coverage.includes.slice(0, 3)]
      };
    });

    // Sort by price
    quotes.sort((a, b) => a.priceValue - b.priceValue);

    console.log(`✅ Generated ${quotes.length} insurance quotes for ${destination}`);

    return NextResponse.json({
      quotes,
      coverageOptions: COVERAGE_TYPES,
      tripSummary: {
        destination,
        duration: `${tripDays} days`,
        travelers,
        tripCost: `$${tripCost.toLocaleString()}`
      },
      disclaimer: "Prices are estimates. Final pricing determined by insurance provider. GladysTravelAI earns a commission on purchases at no extra cost to you."
    });

  } catch (err: any) {
    console.error("Insurance quote generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate insurance quotes", details: err.message },
      { status: 500 }
    );
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    status: "operational",
    service: "GladysTravelAI Insurance API",
    version: "1.0.0",
    partners: INSURANCE_PARTNERS.map(p => p.name),
    coverageTypes: Object.keys(COVERAGE_TYPES)
  });
}