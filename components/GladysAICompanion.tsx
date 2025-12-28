"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Mic, MicOff, Volume2, VolumeX, Sparkles, Trophy, MapPin, Calendar, Ticket } from "lucide-react";
import { eventService } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    events?: any[];
    stadiums?: any[];
    suggestions?: string[];
  };
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
}

// Real Stadium Database
const STADIUM_DATABASE = {
  // NFL Stadiums
  "SoFi Stadium": {
    name: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    capacity: 70240,
    opened: 2020,
    teams: ["Los Angeles Rams", "Los Angeles Chargers"],
    sports: ["american-football"],
    address: "1001 Stadium Dr, Inglewood, CA 90301",
    coordinates: { lat: 33.9535, lng: -118.3390 },
    features: ["Retractable roof", "4K video board", "Premium suites", "Standing room"],
    nearbyHotels: 45,
    avgHotelPrice: 280,
    parkingCost: 80,
    bestSeats: "Lower bowl sections 101-149",
    accessibility: "Full ADA compliance with elevators and wheelchair seating"
  },
  "MetLife Stadium": {
    name: "MetLife Stadium",
    city: "New York",
    country: "USA",
    capacity: 82500,
    opened: 2010,
    teams: ["New York Giants", "New York Jets"],
    sports: ["american-football"],
    address: "1 MetLife Stadium Dr, East Rutherford, NJ 07073",
    coordinates: { lat: 40.8128, lng: -74.0742 },
    features: ["Open-air", "HD video boards", "Climate-controlled suites"],
    nearbyHotels: 120,
    avgHotelPrice: 350,
    parkingCost: 40,
    bestSeats: "Lower level sideline sections 111-134",
    accessibility: "Full ADA compliance with wheelchair seating and accessible parking"
  },
  // Soccer Stadiums
  "Camp Nou": {
    name: "Camp Nou",
    city: "Barcelona",
    country: "Spain",
    capacity: 99354,
    opened: 1957,
    teams: ["FC Barcelona"],
    sports: ["football"],
    address: "C. d'Arístides Maillol, 12, Barcelona",
    coordinates: { lat: 41.3809, lng: 2.1228 },
    features: ["Museum", "Stadium tour", "Iconic architecture"],
    nearbyHotels: 85,
    avgHotelPrice: 180,
    parkingCost: 25,
    bestSeats: "Main stand (Tribuna) central sections",
    accessibility: "Wheelchair accessible with designated seating areas"
  },
  "Wembley Stadium": {
    name: "Wembley Stadium",
    city: "London",
    country: "UK",
    capacity: 90000,
    opened: 2007,
    teams: ["England National Team"],
    sports: ["football"],
    address: "Wembley, London HA9 0WS",
    coordinates: { lat: 51.5560, lng: -0.2795 },
    features: ["Retractable roof", "Iconic arch", "Royal box", "Club Wembley"],
    nearbyHotels: 150,
    avgHotelPrice: 220,
    parkingCost: 30,
    bestSeats: "Lower tier between goals, Bobby Moore sections",
    accessibility: "Full accessibility with dedicated wheelchair areas"
  },
  // Basketball
  "Madison Square Garden": {
    name: "Madison Square Garden",
    city: "New York",
    country: "USA",
    capacity: 20789,
    opened: 1968,
    teams: ["New York Knicks", "New York Rangers"],
    sports: ["basketball", "hockey"],
    address: "4 Pennsylvania Plaza, New York, NY 10001",
    coordinates: { lat: 40.7505, lng: -73.9934 },
    features: ["Historic venue", "Celebrity row", "Premium clubs"],
    nearbyHotels: 200,
    avgHotelPrice: 400,
    parkingCost: 50,
    bestSeats: "Bridge level (200s) center court",
    accessibility: "ADA compliant with elevator access"
  },
  // More stadiums...
  "Allianz Arena": {
    name: "Allianz Arena",
    city: "Munich",
    country: "Germany",
    capacity: 75024,
    opened: 2005,
    teams: ["Bayern Munich"],
    sports: ["football"],
    address: "Werner-Heisenberg-Allee 25, Munich",
    coordinates: { lat: 48.2188, lng: 11.6247 },
    features: ["Color-changing exterior", "Museum", "Stadium tour"],
    nearbyHotels: 95,
    avgHotelPrice: 160,
    parkingCost: 15,
    bestSeats: "Lower tier midfield sections",
    accessibility: "Full wheelchair access with lifts"
  }
};

interface AIConciergeProps {
  currentDestination?: string;
  onShowMaps?: (from: string, to: string) => void;
  onAction?: (action: string, payload: any) => void;
}

export default function GladysAICompanion({
  currentDestination,
  onShowMaps,
  onAction,
}: AIConciergeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [userContext, setUserContext] = useState<UserContext>({
    preferredCities: [],
    budget: 'moderate',
    recentQueries: [],
    conversationCount: 0,
    favoriteTeams: [],
    favoriteSports: [],
    recentEvents: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeGladys = async () => {
      const savedContext = localStorage.getItem('gladys-user-context');
      let context: UserContext = {
        preferredCities: [],
        budget: 'moderate',
        recentQueries: [],
        conversationCount: 0,
        favoriteTeams: [],
        favoriteSports: [],
        recentEvents: []
      };

      if (savedContext) {
        context = JSON.parse(savedContext);
        setUserContext(context);
      }

      // Load featured events
      const featured = getFeaturedEvents();
      const upcoming = featured.filter(e => new Date(e.startDate) > new Date()).slice(0, 3);

      let greeting = '';
      if (context.name && context.conversationCount > 0) {
        const greetings = [
          `Hey ${context.name}! 🏆 Ready to catch some epic events?`,
          `Welcome back, ${context.name}! ✨ Let's find your next game!`,
          `Hi ${context.name}! 🎫 What event are you hunting for?`,
        ];
        greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        if (upcoming.length > 0) {
          greeting += `\n\n🔥 Hot right now:\n${upcoming.map(e => 
            `• ${e.name} - ${e.venue.city} (${new Date(e.startDate).toLocaleDateString()})`
          ).join('\n')}`;
        }
      } else if (context.conversationCount > 0) {
        greeting = `Welcome back! 🎉 Ready to find some amazing events?`;
      } else {
        greeting = `Hey there! 👋 I'm Gladys, your AI sports & events companion!\n\n🏆 I can help you:\n🎫 Find tickets to ANY event worldwide\n🏟️ Get stadium info & best seats\n✈️ Plan trips around games\n📍 Find hotels near venues\n🎯 Track your favorite teams\n\nWhat's your name? Let's get started! 😊`;
      }

      setMessages([{
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        metadata: { events: upcoming }
      }]);
    };

    initializeGladys();

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
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
    localStorage.setItem('gladys-user-context', JSON.stringify(userContext));
  }, [userContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    const cleanText = text.replace(/[🏆🎫✈️📍🎯🔥👋✨🎉😊]/g, '');
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

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  };

  // Smart intent detection
  const detectIntent = (message: string): string => {
    const lower = message.toLowerCase();
    
    if (/(find|search|show|get).*(event|game|match|concert)/i.test(message)) return 'search_events';
    if (/(stadium|arena|venue).*(info|details|about)/i.test(message)) return 'stadium_info';
    if (/(ticket|price|cost|buy)/i.test(message)) return 'ticket_info';
    if (/(hotel|stay|accommodation).*(near|around)/i.test(message)) return 'nearby_hotels';
    if (/(how to get|directions|transport).*(stadium|venue)/i.test(message)) return 'directions';
    if (/(best seat|where to sit)/i.test(message)) return 'seating_advice';
    if (/(my name is|call me|i'm)/i.test(message)) return 'save_name';
    if (/(favorite team|support|fan of)/i.test(message)) return 'save_team';
    
    return 'general_chat';
  };

  const processSmartResponse = async (message: string, intent: string): Promise<{ text: string; metadata?: any }> => {
    const lower = message.toLowerCase();
    
    switch (intent) {
      case 'search_events': {
        // Extract location from message
        const cityMatch = message.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        const city = cityMatch ? cityMatch[1] : currentDestination || 'New York';
        
        try {
          const events = await eventService.universalSearch(city);
          const relevantEvents = events.slice(0, 5);
          
          if (relevantEvents.length > 0) {
            let response = `🎉 Found ${events.length} events in ${city}!\n\nHere are the top picks:\n\n`;
            relevantEvents.forEach((e, i) => {
              response += `${i + 1}. ${e.name}\n   📍 ${e.venue?.city}\n   📅 ${new Date(e.startDate).toLocaleDateString()}\n   💰 From ${e.priceRange?.currency || 'USD'} $${e.priceRange?.min || 'TBA'}\n\n`;
            });
            response += `Want details on any of these? Just ask! 🎫`;
            
            return { text: response, metadata: { events: relevantEvents } };
          } else {
            return { text: `Hmm, I couldn't find live events in ${city} right now. Try:\n• Different city\n• Specific sport (NBA, NFL, etc.)\n• Upcoming dates\n\nOr browse all events at /events! 🔍` };
          }
        } catch (error) {
          return { text: "Oops! Had trouble searching events. Try browsing /events page! 🎫" };
        }
      }
      
      case 'stadium_info': {
        const stadiumMatch = message.match(/(SoFi|MetLife|Camp Nou|Wembley|Madison Square Garden|Allianz Arena)/i);
        if (stadiumMatch) {
          const stadiumName = Object.keys(STADIUM_DATABASE).find(s => 
            s.toLowerCase().includes(stadiumMatch[1].toLowerCase())
          );
          
          if (stadiumName) {
            const stadium = STADIUM_DATABASE[stadiumName as keyof typeof STADIUM_DATABASE];
            return {
              text: `🏟️ ${stadium.name} - ${stadium.city}, ${stadium.country}\n\n` +
                    `👥 Capacity: ${stadium.capacity.toLocaleString()}\n` +
                    `🏆 Home Teams: ${stadium.teams.join(', ')}\n` +
                    `🎯 Best Seats: ${stadium.bestSeats || 'Center sections recommended'}\n` +
                    `🏨 Nearby Hotels: ${stadium.nearbyHotels}+ (avg ${stadium.avgHotelPrice}/night)\n` +
                    `${stadium.parkingCost ? `🚗 Parking: ${stadium.parkingCost}\n` : ''}` +
                    `${stadium.accessibility ? `♿ Accessibility: ${stadium.accessibility}\n` : ''}` +
                    `✨ Features: ${stadium.features.join(', ')}\n\n` +
                    `Want directions or hotels nearby? Just ask! 📍`,
              metadata: { stadiums: [stadium] }
            };
          }
        }
        return { text: "Which stadium are you interested in? I know about:\n• SoFi Stadium (LA)\n• MetLife Stadium (NY)\n• Camp Nou (Barcelona)\n• Wembley (London)\n• Madison Square Garden (NY)\n• Allianz Arena (Munich)\n\nJust ask about any of these! 🏟️" };
      }
      
      case 'save_name': {
        const nameMatch = message.match(/(?:my name is|call me|i'm)\s+([A-Za-z]+)/i);
        if (nameMatch) {
          const name = nameMatch[1];
          setUserContext(prev => ({ ...prev, name }));
          return { text: `Awesome! Nice to meet you, ${name}! 🎉\n\nNow I can give you personalized recommendations. What events or teams are you into? 🏆` };
        }
        break;
      }
      
      case 'save_team': {
        const teamMatch = message.match(/(?:favorite team|support|fan of)\s+(?:is\s+)?(.+?)(?:\.|$)/i);
        if (teamMatch) {
          const team = teamMatch[1].trim();
          setUserContext(prev => ({
            ...prev,
            favoriteTeams: [...(prev.favoriteTeams || []), team].slice(0, 5)
          }));
          return { text: `Nice! ${team} fan! 🏆 I'll keep an eye out for their games and let you know about upcoming matches! Want me to find their next game? 🎫` };
        }
        break;
      }
      
      case 'nearby_hotels': {
        const stadiumMatch = message.match(/(stadium|arena|venue|[A-Z][a-z]+\s+Stadium)/i);
        if (stadiumMatch) {
          return { text: `🏨 Looking for hotels? I can help!\n\nFor the best options:\n1. Tell me the specific venue\n2. Your budget (budget/moderate/luxury)\n3. Dates you need\n\nThen I'll find you the perfect stay! 😊\n\nOr search destinations with hotels on our main page!` };
        }
        break;
      }
      
      case 'seating_advice': {
        return { text: `🎯 Best seating tips:\n\n🏈 NFL/Football:\n• Lower bowl 50-yard line for best view\n• End zone for atmosphere\n• Club seats for comfort\n\n⚽ Soccer:\n• Behind goals for atmosphere\n• Midfield for best view\n• Lower tier closer to action\n\n🏀 NBA:\n• Court side = $$$\n• Lower bowl = great view\n• Upper bowl = budget friendly\n\nWhich stadium are you going to? I can give specific advice! 🏟️` };
      }
      
      case 'ticket_info': {
        return { text: `🎫 Ticket Tips:\n\n💡 Best practices:\n• Book early for big games (2-3 months)\n• Check official sites first\n• Compare: StubHub, SeatGeek, Vivid Seats\n• Prices drop close to game day (risky!)\n• Midweek games are cheaper\n\n🔥 Hot tickets sell out fast:\n• Playoffs\n• Rivalry games\n• Opening/closing games\n• Big concerts\n\nWhich event are you after? I'll help you find the best deal! 💰` };
      }
    }
    
    return { text: "I'm here to help with events, tickets, stadiums, and travel! What would you like to know? 🎫" };
  };

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage) return;

    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // Detect intent and process locally first
      const intent = detectIntent(userMessage);
      const response = await processSmartResponse(userMessage, intent);

      setUserContext((prev) => ({
        ...prev,
        recentQueries: [userMessage, ...prev.recentQueries].slice(0, 10),
        conversationCount: prev.conversationCount + 1
      }));

      const aiMessage: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (voiceEnabled) {
        speak(response.text);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Oops! Something went wrong. Try asking about:\n🎫 Events in your city\n🏟️ Stadium information\n✈️ Travel planning\n\nWhat can I help with? 😊",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history?')) {
      setMessages([]);
    }
  };

  const handleEventClick = (event: any) => {
    if (event.url) {
      window.open(event.url, '_blank');
    } else if (event.id) {
      router.push(`/events/${event.id}`);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Siri-Style Floating Orb Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 group"
          aria-label="Open Gladys AI Assistant"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-75 blur-xl animate-pulse-slow"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-60 blur-2xl animate-pulse-slower"></div>

          <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-70 animate-spin-slow"></div>
            <div className="absolute inset-3 md:inset-4 rounded-full bg-gradient-to-br from-white/40 to-transparent backdrop-blur-sm"></div>
            <Sparkles className="relative z-10 text-white drop-shadow-lg w-6 h-6 md:w-9 md:h-9" />
          </div>

          <div className="hidden md:block absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-float-1 opacity-60"></div>
          <div className="hidden md:block absolute -bottom-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-float-2 opacity-60"></div>
          <div className="hidden md:block absolute top-1/2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-float-3 opacity-60"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl h-[85vh] flex flex-col">
            <div className="flex-1 flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b border-white/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-20 blur-3xl rounded-full animate-pulse-slow"></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-80 blur-md animate-pulse-slow"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-70 animate-spin-slow"></div>
                        <Trophy className="relative z-10 text-white" size={28} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                        Gladys AI
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userContext.name ? `Hey ${userContext.name}! 🎫` : 'Your Sports & Events Expert'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 backdrop-blur-sm transition-all"
                    >
                      {voiceEnabled ? <Volume2 size={20} className="text-purple-600" /> : <VolumeX size={20} className="text-gray-400" />}
                    </button>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 backdrop-blur-sm transition-all"
                    >
                      <X size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <div key={idx}>
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}>
                      <div className={`max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg'
                          : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-md text-gray-900 dark:text-gray-100 shadow-md border border-white/20'
                      } rounded-3xl px-6 py-4`}>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Event Cards */}
                    {message.metadata?.events && message.metadata.events.length > 0 && (
                      <div className="mt-3 space-y-2 ml-4">
                        {message.metadata.events.map((event: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleEventClick(event)}
                            className="w-full text-left bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              {event.image && (
                                <img src={event.image} alt={event.name} className="w-16 h-16 rounded-xl object-cover" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">{event.name}</h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {event.venue?.city}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(event.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <Ticket className="text-blue-600" size={20} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-message-in">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl px-6 py-4 shadow-md border border-white/20">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-white/10">
                {/* Quick Actions */}
                <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => handleSend("Find events near me")}
                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  >
                    🎫 Events Near Me
                  </button>
                  <button
                    onClick={() => handleSend("Show me stadium info")}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  >
                    🏟️ Stadium Info
                  </button>
                  <button
                    onClick={() => handleSend("Best ticket deals")}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-blue-100 hover:from-pink-200 hover:to-blue-200 text-pink-700 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  >
                    💰 Ticket Deals
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Mic Button */}
                  <button
                    onClick={startListening}
                    disabled={isListening || loading}
                    className={`p-4 rounded-2xl transition-all shadow-lg ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse scale-110'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-600'
                    }`}
                    aria-label={isListening ? "Listening..." : "Start voice input"}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  {/* Input Field */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isListening ? "🎙️ Listening..." : "Ask about events, stadiums, tickets..."}
                      className="w-full h-14 px-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-2 border-white/20 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 outline-none text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 transition-all"
                      disabled={loading || isListening}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading || isListening}
                    className="p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={22} />
                  </button>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {isSpeaking && (
                    <div className="flex items-center space-x-2">
                      <Volume2 size={14} className="animate-pulse text-purple-600" />
                      <span>Speaking...</span>
                      <button onClick={stopSpeaking} className="hover:underline font-medium">
                        Stop
                      </button>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    {userContext.favoriteTeams && userContext.favoriteTeams.length > 0 && (
                      <span className="text-purple-600 font-medium">
                        🏆 {userContext.favoriteTeams[0]}
                      </span>
                    )}
                    {messages.length > 2 && (
                      <button
                        onClick={clearHistory}
                        className="hover:text-purple-600 transition-colors font-medium"
                      >
                        Clear Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-message-in {
          animation: message-in 0.3s ease-out;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.75;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10px, -15px); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, 15px); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 10px); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 4s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-float-1 {
          animation: float-1 3s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 4s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 3.5s ease-in-out infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}