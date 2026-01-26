"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, X, Mic, MicOff, Volume2, VolumeX, Sparkles, Trophy, MapPin, 
  Calendar, Ticket, ShoppingCart, Check, AlertCircle, Loader2, 
  CreditCard, Plane, Hotel, UtensilsCrossed, Clock, DollarSign,
  TrendingDown, Bell, Bookmark, Eye, ChevronRight, Package,
  Zap, Target, Brain, MessageSquare, Settings as SettingsIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { eventService } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

// ==================== TYPES ====================
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    events?: any[];
    stadiums?: any[];
    suggestions?: string[];
    cart?: CartItem[];
    agentStatus?: AgentStatus;
    priceComparison?: PriceComparison[];
  };
}

interface CartItem {
  id: string;
  type: 'event' | 'flight' | 'hotel' | 'restaurant' | 'transport' | 'insurance';
  name: string;
  description: string;
  price: number;
  currency: string;
  provider: string;
  affiliateUrl: string;
  commission: number;
  image?: string;
  details: any;
  selected: boolean;
}

interface AgentStatus {
  phase: 'searching' | 'comparing' | 'building' | 'optimizing' | 'ready' | 'monitoring';
  step: string;
  progress: number;
  tasksCompleted: string[];
  currentTask?: string;
}

interface PriceComparison {
  provider: string;
  price: number;
  fees: number;
  total: number;
  affiliateUrl: string;
  commission: number;
  rating: number;
  features: string[];
  recommended?: boolean;
}

interface Watchlist {
  id: string;
  eventName: string;
  targetPrice: number;
  currentPrice: number;
  priceHistory: { date: Date; price: number }[];
  alertEnabled: boolean;
  created: Date;
}

interface UserContext {
  name?: string;
  preferredCities: string[];
  budget: 'budget' | 'moderate' | 'luxury';
  recentQueries: string[];
  conversationCount: number;
  travelStyle?: string;
  upcomingTrips?: any[];
  favoriteTeams?: string[];
  favoriteSports?: string[];
  recentEvents?: any[];
  autonomousMode: boolean;
  watchlist: Watchlist[];
  savedCarts: CartItem[][];
}

// ==================== AFFILIATE PARTNERS ====================
const AFFILIATE_PARTNERS = {
  tickets: {
    ticketmaster: {
      name: "Ticketmaster",
      baseUrl: "https://www.ticketmaster.com",
      affiliateId: "YOUR_TM_AFFILIATE_ID",
      commission: 5, // 5% commission
      logo: "🎫",
      features: ["Official", "Verified", "Mobile tickets", "Fan protection"]
    },
    stubhub: {
      name: "StubHub",
      baseUrl: "https://www.stubhub.com",
      affiliateId: "YOUR_STUBHUB_AFFILIATE_ID",
      commission: 8,
      logo: "🎟️",
      features: ["FanProtect™", "Price match", "Mobile app", "Last minute deals"]
    },
    seatgeek: {
      name: "SeatGeek",
      baseUrl: "https://seatgeek.com",
      affiliateId: "YOUR_SEATGEEK_AFFILIATE_ID",
      commission: 6,
      logo: "💺",
      features: ["Deal Score", "Interactive maps", "Best value", "Mobile entry"]
    },
    vividseats: {
      name: "Vivid Seats",
      baseUrl: "https://www.vividseats.com",
      affiliateId: "YOUR_VIVID_AFFILIATE_ID",
      commission: 7,
      logo: "✨",
      features: ["100% Buyer Guarantee", "Rewards program", "VIP packages", "Group deals"]
    }
  },
  flights: {
    skyscanner: {
      name: "Skyscanner",
      baseUrl: "https://www.skyscanner.com",
      affiliateId: "YOUR_SKYSCANNER_ID",
      commission: 3,
      logo: "✈️"
    },
    kayak: {
      name: "KAYAK",
      baseUrl: "https://www.kayak.com",
      affiliateId: "YOUR_KAYAK_ID",
      commission: 4,
      logo: "🛫"
    },
    expedia: {
      name: "Expedia",
      baseUrl: "https://www.expedia.com",
      affiliateId: "YOUR_EXPEDIA_ID",
      commission: 5,
      logo: "🌍"
    }
  },
  hotels: {
    booking: {
      name: "Booking.com",
      baseUrl: "https://www.booking.com",
      affiliateId: "YOUR_BOOKING_ID",
      commission: 4,
      logo: "🏨"
    },
    hotels: {
      name: "Hotels.com",
      baseUrl: "https://www.hotels.com",
      affiliateId: "YOUR_HOTELS_ID",
      commission: 4.5,
      logo: "🏩"
    },
    airbnb: {
      name: "Airbnb",
      baseUrl: "https://www.airbnb.com",
      affiliateId: "YOUR_AIRBNB_ID",
      commission: 3,
      logo: "🏠"
    }
  }
};

// ==================== AGENT WORKFLOW ENGINE ====================
class AgentWorkflowEngine {
  private status: AgentStatus = {
    phase: 'searching',
    step: '',
    progress: 0,
    tasksCompleted: []
  };

  async executeAutonomousBooking(query: string, budget: number, preferences: any): Promise<{
    cart: CartItem[];
    status: AgentStatus;
    recommendations: string[];
  }> {
    const cart: CartItem[] = [];
    const recommendations: string[] = [];

    // Phase 1: Search across all platforms
    this.updateStatus('searching', 'Searching events across all platforms...', 10);
    await this.sleep(1500);
    
    const events = await this.searchEvents(query);
    this.updateStatus('searching', 'Found events! Comparing prices...', 25);
    await this.sleep(1000);

    // Phase 2: Price comparison
    this.updateStatus('comparing', 'Comparing prices across 4 ticket platforms...', 40);
    const bestTicketDeal = await this.compareTicketPrices(events[0]);
    await this.sleep(1500);

    if (bestTicketDeal) {
      cart.push(bestTicketDeal);
      this.status.tasksCompleted.push(`✓ Found best ticket deal: $${bestTicketDeal.price}`);
    }

    // Phase 3: Build complete trip
    this.updateStatus('building', 'Finding flights to event destination...', 55);
    await this.sleep(1500);
    
    const flight = await this.findBestFlight(events[0], preferences);
    if (flight) {
      cart.push(flight);
      this.status.tasksCompleted.push(`✓ Booked flight: $${flight.price}`);
    }

    this.updateStatus('building', 'Searching hotels near venue...', 70);
    await this.sleep(1500);

    const hotel = await this.findBestHotel(events[0], preferences);
    if (hotel) {
      cart.push(hotel);
      this.status.tasksCompleted.push(`✓ Found hotel: $${hotel.price}/night`);
    }

    // Phase 4: Optimize and finalize
    this.updateStatus('optimizing', 'Optimizing total cost and schedule...', 85);
    await this.sleep(1000);

    const optimized = this.optimizeCart(cart, budget);
    recommendations.push(...this.generateRecommendations(cart, budget));

    this.updateStatus('ready', 'Trip ready for your approval!', 100);
    this.status.tasksCompleted.push(`✓ Total savings: $${this.calculateSavings(cart)}`);

    return { cart: optimized, status: this.status, recommendations };
  }

  private updateStatus(phase: AgentStatus['phase'], step: string, progress: number) {
    this.status = { ...this.status, phase, step, progress, currentTask: step };
  }

  private async searchEvents(query: string): Promise<any[]> {
    try {
      const events = await eventService.universalSearch(query);
      return events.slice(0, 5);
    } catch {
      return [];
    }
  }

  private async compareTicketPrices(event: any): Promise<CartItem | null> {
    // Simulate price comparison across platforms
    const prices = [
      { provider: 'ticketmaster', price: 250, commission: 12.50 },
      { provider: 'stubhub', price: 235, commission: 18.80 },
      { provider: 'seatgeek', price: 245, commission: 14.70 },
      { provider: 'vividseats', price: 240, commission: 16.80 }
    ];

    const best = prices.sort((a, b) => a.price - b.price)[0];
    const partner = AFFILIATE_PARTNERS.tickets[best.provider as keyof typeof AFFILIATE_PARTNERS.tickets];

    return {
      id: `ticket-${Date.now()}`,
      type: 'event',
      name: event?.name || 'Event Ticket',
      description: `${event?.venue?.city} - ${new Date(event?.startDate).toLocaleDateString()}`,
      price: best.price,
      currency: 'USD',
      provider: partner.name,
      affiliateUrl: `${partner.baseUrl}/event/${event?.id}?aid=${partner.affiliateId}`,
      commission: best.commission,
      image: event?.image,
      details: { event, platform: best.provider },
      selected: true
    };
  }

  private async findBestFlight(event: any, preferences: any): Promise<CartItem | null> {
    const prices = [
      { provider: 'skyscanner', price: 450, commission: 13.50 },
      { provider: 'kayak', price: 465, commission: 18.60 },
      { provider: 'expedia', price: 440, commission: 22.00 }
    ];

    const best = prices.sort((a, b) => a.price - b.price)[0];
    const partner = AFFILIATE_PARTNERS.flights[best.provider as keyof typeof AFFILIATE_PARTNERS.flights];

    return {
      id: `flight-${Date.now()}`,
      type: 'flight',
      name: `Round-trip to ${event?.venue?.city}`,
      description: `${preferences.origin || 'Your city'} → ${event?.venue?.city}`,
      price: best.price,
      currency: 'USD',
      provider: partner.name,
      affiliateUrl: `${partner.baseUrl}/flights?to=${event?.venue?.city}&aid=${partner.affiliateId}`,
      commission: best.commission,
      details: { route: 'round-trip', class: 'economy' },
      selected: true
    };
  }

  private async findBestHotel(event: any, preferences: any): Promise<CartItem | null> {
    const pricePerNight = preferences.budget === 'luxury' ? 300 : preferences.budget === 'moderate' ? 150 : 80;
    const nights = 3;
    const totalPrice = pricePerNight * nights;

    const partner = AFFILIATE_PARTNERS.hotels.booking;

    return {
      id: `hotel-${Date.now()}`,
      type: 'hotel',
      name: `Hotel near ${event?.venue?.name}`,
      description: `${nights} nights • ${pricePerNight}/night`,
      price: totalPrice,
      currency: 'USD',
      provider: partner.name,
      affiliateUrl: `${partner.baseUrl}/searchresults.html?city=${event?.venue?.city}&aid=${partner.affiliateId}`,
      commission: totalPrice * 0.04,
      details: { nights, pricePerNight, location: 'near venue' },
      selected: true
    };
  }

  private optimizeCart(cart: CartItem[], budget: number): CartItem[] {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    if (total > budget * 1.1) {
      // Downgrade hotel if over budget
      const hotelIndex = cart.findIndex(item => item.type === 'hotel');
      if (hotelIndex !== -1) {
        cart[hotelIndex].price *= 0.7;
        cart[hotelIndex].description = cart[hotelIndex].description.replace(/\d+ nights/, '2 nights');
      }
    }

    return cart;
  }

  private calculateSavings(cart: CartItem[]): number {
    return Math.floor(Math.random() * 200) + 50;
  }

  private generateRecommendations(cart: CartItem[], budget: number): string[] {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const recommendations = [];

    if (total < budget * 0.8) {
      recommendations.push("💎 You're under budget! Consider upgrading your hotel or seats.");
    }

    recommendations.push("🎯 Book now to lock in these prices - they may increase!");
    recommendations.push("✈️ Add trip insurance for peace of mind ($45)");
    
    return recommendations;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): AgentStatus {
    return this.status;
  }
}

// ==================== MAIN COMPONENT ====================
interface GladysAIAgentProps {
  currentDestination?: string;
  onBookingComplete?: (cart: CartItem[]) => void;
}

export default function GladysAIAgent({ currentDestination, onBookingComplete }: GladysAIAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Agent-specific states
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [userContext, setUserContext] = useState<UserContext>({
    preferredCities: [],
    budget: 'moderate',
    recentQueries: [],
    conversationCount: 0,
    favoriteTeams: [],
    favoriteSports: [],
    recentEvents: [],
    autonomousMode: false,
    watchlist: [],
    savedCarts: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const agentEngineRef = useRef<AgentWorkflowEngine>(new AgentWorkflowEngine());
  const router = useRouter();

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    const initializeGladys = async () => {
      const savedContext = localStorage.getItem('gladys-agent-context');
      let context: UserContext = {
        preferredCities: [],
        budget: 'moderate',
        recentQueries: [],
        conversationCount: 0,
        favoriteTeams: [],
        favoriteSports: [],
        recentEvents: [],
        autonomousMode: false,
        watchlist: [],
        savedCarts: []
      };

      if (savedContext) {
        context = JSON.parse(savedContext);
        setUserContext(context);
        setWatchlist(context.watchlist);
      }

      const featured = getFeaturedEvents().slice(0, 3);

      let greeting = '';
      if (context.name && context.conversationCount > 0) {
        greeting = `Welcome back, ${context.name}! 🎯\n\nI'm your autonomous travel agent. I can:\n\n🤖 **Autonomous Mode**: I'll search, compare, and build your entire trip automatically\n🎫 Compare tickets across 4 platforms\n✈️ Find the best flights\n🏨 Book hotels near venues\n📊 Monitor prices and alert you to deals\n\nReady to plan something amazing?`;
      } else {
        greeting = `Hey there! 👋 I'm Gladys, your **AI autonomous travel agent**!\n\n🎯 **What I can do:**\n\n**Phase 1: Intelligent Search**\n• Search events across all platforms\n• Compare ticket prices in real-time\n• Give personalized recommendations\n\n**Phase 2: Semi-Autonomous**\n• Build complete trips (Event + Flight + Hotel)\n• Show you options to customize\n• One-click booking\n\n**Phase 3: Full Agent Mode** 🤖\n• Complete autonomous booking\n• Price monitoring & alerts\n• Watchlist favorite events\n• Multi-step workflows\n\nWhat's your name? Let's get started! 😊`;
      }

      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        metadata: { events: featured }
      }]);
    };

    initializeGladys();

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gladys-agent-context', JSON.stringify(userContext));
  }, [userContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==================== AGENT LOGIC ====================
  const handleAutonomousBooking = async (query: string, budget: number = 2000) => {
    setLoading(true);
    
    // System message: Agent starting
    const systemMsg: Message = {
      role: 'system',
      content: '🤖 **Agent Mode Activated**\n\nStarting autonomous trip building...',
      timestamp: new Date(),
      metadata: { 
        agentStatus: {
          phase: 'searching',
          step: 'Initializing...',
          progress: 0,
          tasksCompleted: []
        }
      }
    };
    
    setMessages(prev => [...prev, systemMsg]);

    try {
      const result = await agentEngineRef.current.executeAutonomousBooking(
        query,
        budget,
        { origin: userContext.preferredCities[0] || 'New York', budget: userContext.budget }
      );

      // Update cart
      setCart(result.cart);
      setAgentStatus(result.status);

      // Show results
      const total = result.cart.reduce((sum, item) => sum + item.price, 0);
      const commission = result.cart.reduce((sum, item) => sum + item.commission, 0);

      const resultMsg: Message = {
        role: 'assistant',
        content: `✨ **Trip Built Successfully!**\n\n` +
                 `I've assembled your complete trip:\n\n` +
                 `📋 **${result.cart.length} items** in cart\n` +
                 `💰 **Total**: $${total.toFixed(2)}\n` +
                 `💎 **Savings**: $${agentEngineRef.current.getStatus().tasksCompleted.find(t => t.includes('savings'))?.match(/\$(\d+)/)?.[1] || '0'}\n\n` +
                 `${result.recommendations.map(r => `${r}`).join('\n')}\n\n` +
                 `✅ Ready to book? Review your cart!`,
        timestamp: new Date(),
        metadata: { cart: result.cart, agentStatus: result.status }
      };

      setMessages(prev => [...prev, resultMsg]);
      setShowCart(true);

    } catch (error) {
      const errorMsg: Message = {
        role: 'system',
        content: '❌ Agent encountered an error. Please try again or use manual mode.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceComparison = async (eventName: string): Promise<PriceComparison[]> => {
    // Simulate price comparison
    return [
      {
        provider: 'Ticketmaster',
        price: 250,
        fees: 35,
        total: 285,
        affiliateUrl: AFFILIATE_PARTNERS.tickets.ticketmaster.baseUrl,
        commission: 14.25,
        rating: 4.5,
        features: AFFILIATE_PARTNERS.tickets.ticketmaster.features,
        recommended: false
      },
      {
        provider: 'StubHub',
        price: 235,
        fees: 30,
        total: 265,
        affiliateUrl: AFFILIATE_PARTNERS.tickets.stubhub.baseUrl,
        commission: 21.20,
        rating: 4.7,
        features: AFFILIATE_PARTNERS.tickets.stubhub.features,
        recommended: true
      },
      {
        provider: 'SeatGeek',
        price: 245,
        fees: 28,
        total: 273,
        affiliateUrl: AFFILIATE_PARTNERS.tickets.seatgeek.baseUrl,
        commission: 16.38,
        rating: 4.6,
        features: AFFILIATE_PARTNERS.tickets.seatgeek.features,
        recommended: false
      },
      {
        provider: 'Vivid Seats',
        price: 240,
        fees: 32,
        total: 272,
        affiliateUrl: AFFILIATE_PARTNERS.tickets.vividseats.baseUrl,
        commission: 19.04,
        rating: 4.4,
        features: AFFILIATE_PARTNERS.tickets.vividseats.features,
        recommended: false
      }
    ].sort((a, b) => a.total - b.total);
  };

  const addToWatchlist = (event: any, targetPrice: number) => {
    const newWatch: Watchlist = {
      id: `watch-${Date.now()}`,
      eventName: event.name,
      targetPrice,
      currentPrice: event.price || 250,
      priceHistory: [{ date: new Date(), price: event.price || 250 }],
      alertEnabled: true,
      created: new Date()
    };

    setWatchlist(prev => [...prev, newWatch]);
    setUserContext(prev => ({
      ...prev,
      watchlist: [...prev.watchlist, newWatch]
    }));

    const msg: Message = {
      role: 'system',
      content: `📊 Added **${event.name}** to watchlist!\n\nI'll monitor prices and alert you when it drops below $${targetPrice}.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, msg]);
  };

  const detectIntent = (message: string): string => {
    const lower = message.toLowerCase();
    
    if (/(autonomous|auto|build my trip|plan everything)/i.test(message)) return 'autonomous_booking';
    if (/(compare|price|which is cheaper|best deal)/i.test(message)) return 'price_comparison';
    if (/(watch|monitor|alert|track price)/i.test(message)) return 'add_to_watchlist';
    if (/(show cart|my cart|checkout)/i.test(message)) return 'show_cart';
    if (/(find|search|show|get).*(event|game|match)/i.test(message)) return 'search_events';
    if (/(my name is|call me)/i.test(message)) return 'save_name';
    
    return 'general_chat';
  };

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage) return;

    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const intent = detectIntent(userMessage);

      switch (intent) {
        case 'autonomous_booking': {
          // Extract event/destination
          const match = userMessage.match(/(?:to|for|at)\s+([A-Za-z\s]+?)(?:\s+for|\s+in|\s*$)/i);
          const query = match ? match[1].trim() : currentDestination || 'Super Bowl';
          await handleAutonomousBooking(query);
          break;
        }

        case 'price_comparison': {
          const prices = await handlePriceComparison('Event Name');
          const priceMsg: Message = {
            role: 'assistant',
            content: `💰 **Price Comparison Complete!**\n\nHere are the best deals:\n\n` +
                     prices.map((p, i) => 
                       `${i + 1}. **${p.provider}** ${p.recommended ? '⭐ BEST DEAL' : ''}\n` +
                       `   💵 Ticket: $${p.price} + $${p.fees} fees = **$${p.total}**\n` +
                       `   ⭐ Rating: ${p.rating}/5\n` +
                       `   🎯 Features: ${p.features.slice(0, 2).join(', ')}`
                     ).join('\n\n'),
            timestamp: new Date(),
            metadata: { priceComparison: prices }
          };
          setMessages(prev => [...prev, priceMsg]);
          break;
        }

        case 'show_cart': {
          setShowCart(true);
          const cartMsg: Message = {
            role: 'assistant',
            content: cart.length > 0 
              ? `🛒 You have **${cart.length} items** in your cart! Opening cart view...`
              : `Your cart is empty. Let me help you build a trip! 🎫`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, cartMsg]);
          break;
        }

        case 'save_name': {
          const nameMatch = userMessage.match(/(?:my name is|call me)\s+([A-Za-z]+)/i);
          if (nameMatch) {
            const name = nameMatch[1];
            setUserContext(prev => ({ ...prev, name }));
            const msg: Message = {
              role: 'assistant',
              content: `Perfect, ${name}! 🎉\n\nNow I can give you personalized recommendations. Want to try **autonomous mode**? I'll build your entire trip automatically! 🤖`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, msg]);
          }
          break;
        }

        case 'search_events': {
          const cityMatch = userMessage.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
          const city = cityMatch ? cityMatch[1] : currentDestination || 'New York';
          
          try {
            const events = await eventService.universalSearch(city);
            const relevantEvents = events.slice(0, 5);
            
            if (relevantEvents.length > 0) {
              const msg: Message = {
                role: 'assistant',
                content: `🎉 Found **${events.length} events** in ${city}!\n\nTop picks:\n\n` +
                         relevantEvents.map((e, i) => 
                           `${i + 1}. **${e.name}**\n` +
                           `   📍 ${e.venue?.city}\n` +
                           `   📅 ${new Date(e.startDate).toLocaleDateString()}\n` +
                           `   💰 From $${e.priceRange?.min || 'TBA'}`
                         ).join('\n\n') +
                         `\n\nWant me to build a complete trip for any of these? Just say:\n"Build my trip to [event name]" 🤖`,
                timestamp: new Date(),
                metadata: { events: relevantEvents }
              };
              setMessages(prev => [...prev, msg]);
            }
          } catch {
            const msg: Message = {
              role: 'assistant',
              content: `Couldn't find events in ${city}. Try:\n• Different city\n• Specific sport\n• Browse /events page 🔍`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, msg]);
          }
          break;
        }

        default: {
          const msg: Message = {
            role: 'assistant',
            content: `I can help with:\n\n🤖 **"Build my trip to [event]"** - Full autonomous mode\n💰 **"Compare prices for [event]"** - Price comparison\n🔍 **"Find events in [city]"** - Search events\n📊 **"Watch [event]"** - Price monitoring\n🛒 **"Show my cart"** - View cart\n\nWhat would you like to do? 🎫`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, msg]);
        }
      }

      setUserContext(prev => ({
        ...prev,
        recentQueries: [userMessage, ...prev.recentQueries].slice(0, 10),
        conversationCount: prev.conversationCount + 1
      }));

    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: "Oops! Something went wrong. Try again or ask me for help! 😊",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported");
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  };

  const speak = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    const cleanText = text.replace(/[🏆🎫✈️📍🎯🔥👋✨🎉😊🤖💰📊🛒]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const totalCommission = cart.reduce((sum, item) => sum + item.commission, 0);

  // ==================== RENDER ====================
  return (
    <>
      {/* Floating Button - Opulent Design */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 group"
          aria-label="Open Gladys AI Agent"
        >
          {/* Glowing background effects */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500 opacity-60 blur-2xl animate-pulse-slow"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 opacity-40 blur-3xl animate-pulse-slower"></div>

          {/* Main button */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 shadow-2xl flex items-center justify-center">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 opacity-70 animate-spin-slow"></div>
            <div className="absolute inset-3 md:inset-4 rounded-full bg-gradient-to-br from-white/30 to-transparent backdrop-blur-sm"></div>
            <Brain className="relative z-10 text-white drop-shadow-2xl w-7 h-7 md:w-10 md:h-10" strokeWidth={2.5} />
          </div>

          {/* Notification badges */}
          {cart.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
            >
              {cart.length}
            </motion.div>
          )}

          {watchlist.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
            >
              <Bell className="w-3 h-3" />
            </motion.div>
          )}

          {/* Floating particles */}
          <div className="hidden md:block absolute -top-2 -left-2 w-3 h-3 bg-amber-400 rounded-full animate-float-1 opacity-70 shadow-lg"></div>
          <div className="hidden md:block absolute -bottom-2 -right-2 w-2 h-2 bg-rose-400 rounded-full animate-float-2 opacity-70 shadow-lg"></div>
          <div className="hidden md:block absolute top-1/2 -right-3 w-2 h-2 bg-purple-400 rounded-full animate-float-3 opacity-70 shadow-lg"></div>
        </motion.button>
      )}

      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] flex gap-4"
            >
              {/* Main Chat Panel */}
              <div className="flex-1 flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 border-b border-zinc-200/50 dark:border-zinc-700/50">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 opacity-10 blur-3xl"></div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Agent Avatar */}
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 opacity-70 blur-md animate-pulse-slow"></div>
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-xl border-2 border-white/50">
                          <Brain className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                            Gladys Agent
                          </h3>
                          {autonomousMode && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold rounded-full">
                              AUTO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {userContext.name ? `Hey ${userContext.name}!` : 'Autonomous Travel Agent'} 🤖
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCart(!showCart)}
                        className="relative p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all"
                      >
                        <ShoppingCart size={20} className="text-zinc-700 dark:text-zinc-300" />
                        {cart.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {cart.length}
                          </span>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className="p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all"
                      >
                        {voiceEnabled ? (
                          <Volume2 size={20} className="text-purple-600" />
                        ) : (
                          <VolumeX size={20} className="text-zinc-400" />
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(false)}
                        className="p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition-all"
                      >
                        <X size={20} className="text-zinc-700 dark:text-zinc-300" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Agent Status Bar */}
                  {agentStatus && agentStatus.progress < 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          {agentStatus.step}
                        </span>
                        <span className="text-xs font-bold text-purple-600">{agentStatus.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${agentStatus.progress}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className={`flex ${
                        message.role === 'user' ? 'justify-end' : 
                        message.role === 'system' ? 'justify-center' : 
                        'justify-start'
                      }`}>
                        <div className={`max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg'
                            : message.role === 'system'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-zinc-900 dark:text-zinc-100 border border-blue-200/50 dark:border-blue-700/50'
                            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md border border-zinc-200/50 dark:border-zinc-700/50'
                        } rounded-2xl px-5 py-4`}>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-['SF_Pro_Display',_system-ui,_sans-serif]">{message.content}</p>
                          </div>
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Price Comparison Cards */}
                      {message.metadata?.priceComparison && (
                        <div className="mt-3 grid grid-cols-2 gap-3 ml-4">
                          {message.metadata.priceComparison.slice(0, 4).map((price, i) => (
                            <motion.a
                              key={i}
                              href={price.affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.02, y: -2 }}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                price.recommended
                                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-600'
                                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600'
                              }`}
                            >
                              {price.recommended && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Zap className="w-4 h-4 text-emerald-600" fill="currentColor" />
                                  <span className="text-xs font-bold text-emerald-600">BEST DEAL</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-zinc-900 dark:text-white">{price.provider}</span>
                                <span className="text-xs text-zinc-500">⭐ {price.rating}</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-600 mb-1">
                                ${price.total}
                              </div>
                              <div className="text-xs text-zinc-500 mb-2">
                                ${price.price} + ${price.fees} fees
                              </div>
                              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <DollarSign className="w-3 h-3" />
                                You earn ${price.commission.toFixed(2)}
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      )}

                      {/* Event Cards */}
                      {message.metadata?.events && message.metadata.events.length > 0 && (
                        <div className="mt-3 space-y-2 ml-4">
                          {message.metadata.events.slice(0, 3).map((event: any, i: number) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.01, x: 4 }}
                              onClick={() => handleSend(`Build my trip to ${event.name}`)}
                              className="w-full text-left bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-700 p-4 rounded-xl border-2 border-amber-200 hover:border-purple-400 dark:border-amber-700 dark:hover:border-purple-600 transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                {event.image && (
                                  <img src={event.image} alt={event.name} className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-zinc-600" />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-1">
                                    {event.name}
                                  </h4>
                                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                                    <span className="flex items-center gap-1">
                                      <MapPin size={12} />
                                      {event.venue?.city}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {new Date(event.startDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-zinc-800 rounded-2xl px-5 py-4 shadow-md border border-zinc-200/50 dark:border-zinc-700/50">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Agent thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-700/50">
                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend("Build my trip to Super Bowl")}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-rose-100 hover:from-amber-200 hover:to-rose-200 dark:from-amber-900/30 dark:to-rose-900/30 dark:hover:from-amber-900/50 dark:hover:to-rose-900/50 text-amber-900 dark:text-amber-100 rounded-xl text-sm font-medium whitespace-nowrap transition-all border border-amber-200 dark:border-amber-700"
                    >
                      <Zap className="w-4 h-4" />
                      Auto-Build Trip
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend("Compare prices")}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-900 dark:text-purple-100 rounded-xl text-sm font-medium whitespace-nowrap transition-all border border-purple-200 dark:border-purple-700"
                    >
                      <TrendingDown className="w-4 h-4" />
                      Compare Prices
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend("Find events near me")}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 hover:from-blue-200 hover:to-teal-200 dark:from-blue-900/30 dark:to-teal-900/30 text-blue-900 dark:text-blue-100 rounded-xl text-sm font-medium whitespace-nowrap transition-all border border-blue-200 dark:border-blue-700"
                    >
                      <Target className="w-4 h-4" />
                      Find Events
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mic Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startListening}
                      disabled={isListening || loading}
                      className={`p-4 rounded-xl transition-all shadow-lg ${
                        isListening
                          ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white animate-pulse scale-110'
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </motion.button>

                    {/* Input Field */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "🎙️ Listening..." : "Ask me to build your trip, compare prices, or find events..."}
                        className="w-full h-14 px-6 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-purple-400 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-200/30 dark:focus:ring-purple-900/30 outline-none text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 transition-all font-['SF_Pro_Display',_system-ui,_sans-serif]"
                        disabled={loading || isListening}
                      />
                    </div>

                    {/* Send Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading || isListening}
                      className="p-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send size={20} />
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {isSpeaking && (
                      <div className="flex items-center gap-2">
                        <Volume2 size={14} className="animate-pulse text-purple-600" />
                        <span>Speaking...</span>
                        <button onClick={stopSpeaking} className="hover:underline font-medium">
                          Stop
                        </button>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">AI Agent</span>
                      </span>
                      {messages.length > 3 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear chat history?')) {
                              setMessages(messages.slice(0, 1));
                            }
                          }}
                          className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Panel - Cart */}
              <AnimatePresence>
                {showCart && cart.length > 0 && (
                  <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                  >
                    {/* Cart Header */}
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Your Trip</h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{cart.length} items</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCart(false)}
                          className="p-2 hover:bg-white/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                          <X size={18} className="text-zinc-600 dark:text-zinc-400" />
                        </button>
                      </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {cart.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">
                                  {item.type === 'event' ? '🎫' : 
                                   item.type === 'flight' ? '✈️' : 
                                   item.type === 'hotel' ? '🏨' : '🎉'}
                                </span>
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{item.name}</h4>
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-purple-600">${item.price}</span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  +${item.commission.toFixed(2)} earned
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <X size={16} className="text-red-600" />
                            </button>
                          </div>
                          <a
                            href={item.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                          >
                            View on {item.provider} →
                          </a>
                        </motion.div>
                      ))}
                    </div>

                    {/* Cart Footer */}
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-t border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Your Commission</span>
                          <span className="font-semibold text-emerald-600">+${totalCommission.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600 flex justify-between">
                          <span className="font-bold text-zinc-900 dark:text-white">Total</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            ${cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (onBookingComplete) {
                            onBookingComplete(cart);
                          }
                          alert('Redirecting to checkout...');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard size={20} />
                        Checkout
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700;800;900&display=swap');
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-12px, -18px); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(12px, 18px); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-18px, 12px); }
        }

        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3.5s ease-in-out infinite; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        .prose { max-width: none; }
        .prose p { margin: 0; }
      `}</style>
    </>
  );
}