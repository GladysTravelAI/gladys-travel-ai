// components/GladysChat.tsx
// 🎨 GLADYS CHAT UI - PURE PRESENTATION
// This file is PURE UI. It calls Agent API and renders responses.
// It does NOT contain business logic, intent detection, or AI calls.

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, X, Mic, MicOff, Volume2, VolumeX, Brain, 
  Loader2, ShoppingCart, ChevronRight, Sparkles,
  Zap, TrendingDown, Target, MapPin, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentAnalysis } from "@/lib/GladysAgentAI";
import type { CompanionResponse, UserContext, QuickAction } from "@/lib/GladysCompanionAI";

// ==================== TYPES ====================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    events?: any[];
    prices?: any[];
    tripPlan?: any;
    quickActions?: QuickAction[];
    suggestions?: string[];
  };
}

interface CartItem {
  id: string;
  type: string;
  name: string;
  price: number;
  provider: string;
}

// ==================== MAIN COMPONENT ====================

export default function GladysChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const [userContext, setUserContext] = useState<UserContext>({
    budget: 'moderate',
    preferredCities: [],
    conversationCount: 0,
    recentQueries: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const router = useRouter();

  // ==================== INITIALIZATION ====================
  
  useEffect(() => {
    initializeGladys();
    setupSpeech();
  }, []);

  useEffect(() => {
    localStorage.setItem('gladys-context', JSON.stringify(userContext));
  }, [userContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeGladys = async () => {
    // Load saved context
    const savedContext = localStorage.getItem('gladys-context');
    if (savedContext) {
      const context = JSON.parse(savedContext);
      setUserContext(context);
    }

    // Get greeting from API
    try {
      const res = await fetch(`/api/agent/analyze?context=${encodeURIComponent(JSON.stringify(userContext))}`);
      const data = await res.json();
      
      if (data.companionResponse) {
        setMessages([{
          role: 'assistant',
          content: data.companionResponse.message,
          timestamp: new Date(),
          metadata: {
            quickActions: data.companionResponse.quickActions,
            suggestions: data.companionResponse.suggestions
          }
        }]);
      }
    } catch (error) {
      console.error('Failed to load greeting:', error);
    }
  };

  const setupSpeech = () => {
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
  };

  // ==================== CORE SEND LOGIC ====================

  const handleSend = async (message?: string, action?: string) => {
    const userMessage = message || input.trim();
    if (!userMessage && !action) return;

    // Add user message to chat
    if (userMessage) {
      const newUserMessage: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newUserMessage]);
    }

    setInput('');
    setLoading(true);

    try {
      // Call Agent API
      const response = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          userContext,
          action: action || 'analyze'
        })
      });

      const data = await response.json();

      // Update context
      if (data.updatedContext) {
        setUserContext(prev => ({ ...prev, ...data.updatedContext }));
      }

      // Handle navigation
      if (data.agentAnalysis?.shouldNavigateTo) {
        const params = new URLSearchParams(data.agentAnalysis.searchParams || {});
        router.push(`${data.agentAnalysis.shouldNavigateTo}?${params.toString()}`);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.companionResponse.message,
        timestamp: new Date(),
        metadata: {
          events: data.events,
          prices: data.prices,
          tripPlan: data.tripPlan,
          quickActions: data.companionResponse.quickActions,
          suggestions: data.companionResponse.suggestions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add to cart if trip was built
      if (data.tripPlan) {
        addTripToCart(data.tripPlan);
      }

      // Speak response if enabled
      if (voiceEnabled) {
        speak(data.companionResponse.message);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: "Oops! Something went wrong. Please try again! 😊",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== VOICE ====================

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
    synthRef.current.speak(utterance);
  };

  // ==================== CART ====================

  const addTripToCart = (tripPlan: any) => {
    const newItems: CartItem[] = [];
    
    if (tripPlan.tickets?.[0]) {
      newItems.push({
        id: `ticket-${Date.now()}`,
        type: 'ticket',
        name: tripPlan.event.name,
        price: tripPlan.tickets[0].total,
        provider: tripPlan.tickets[0].provider
      });
    }
    
    if (tripPlan.flights?.[0]) {
      newItems.push({
        id: `flight-${Date.now()}`,
        type: 'flight',
        name: tripPlan.flights[0].route,
        price: tripPlan.flights[0].price,
        provider: 'Skyscanner'
      });
    }
    
    if (tripPlan.hotels?.[0]) {
      newItems.push({
        id: `hotel-${Date.now()}`,
        type: 'hotel',
        name: tripPlan.hotels[0].name,
        price: tripPlan.hotels[0].price,
        provider: 'Booking.com'
      });
    }
    
    setCart(prev => [...prev, ...newItems]);
    setShowCart(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // ==================== QUICK ACTIONS ====================

  const executeQuickAction = (action: QuickAction) => {
    switch (action.action) {
      case 'search':
      case 'search_events':
        handleSend(action.data?.query || 'Find events', 'search_events');
        break;
      
      case 'compare_prices':
        handleSend('Compare prices', 'compare_prices');
        break;
      
      case 'build_trip':
      case 'autonomous_trip':
        handleSend(action.data?.query || 'Build my trip', 'build_trip');
        break;
      
      case 'set_budget':
        setUserContext(prev => ({ ...prev, budget: action.data?.budget }));
        handleSend(`Set budget to ${action.data?.budget}`);
        break;
      
      default:
        handleSend(action.label);
    }
  };

  // ==================== RENDER ====================

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 shadow-2xl flex items-center justify-center">
            <Brain className="text-white" size={32} strokeWidth={2.5} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center">
                      <Brain className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                        Gladys Agent
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {userContext.name ? `Hey ${userContext.name}!` : 'Event-First AI Travel Agent'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCart(!showCart)}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all relative"
                    >
                      <ShoppingCart size={20} />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                    >
                      {voiceEnabled ? <Volume2 size={20} className="text-purple-600" /> : <VolumeX size={20} />}
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <MessageBubble 
                    key={idx} 
                    message={message}
                    onQuickAction={executeQuickAction}
                    onSendMessage={handleSend}
                  />
                ))}

                {loading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={startListening}
                    disabled={isListening || loading}
                    className={`p-4 rounded-xl transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                    }`}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "🎙️ Listening..." : "Ask me to find events, compare prices, or build a trip..."}
                    className="flex-1 h-14 px-6 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-purple-400 outline-none"
                    disabled={loading || isListening}
                  />

                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="p-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white rounded-xl disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Cart Sidebar */}
            {showCart && cart.length > 0 && (
              <CartSidebar 
                cart={cart}
                total={cartTotal}
                onClose={() => setShowCart(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== MESSAGE BUBBLE ====================

function MessageBubble({ 
  message, 
  onQuickAction,
  onSendMessage 
}: { 
  message: Message;
  onQuickAction: (action: QuickAction) => void;
  onSendMessage: (msg: string) => void;
}) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${
        message.role === 'user'
          ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white'
          : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
      } rounded-2xl px-5 py-4`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-zinc-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Quick Actions */}
        {message.metadata?.quickActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onQuickAction(action)}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Event Cards */}
        {message.metadata?.events && message.metadata.events.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.metadata.events.slice(0, 3).map((event: any, i: number) => (
              <button
                key={i}
                onClick={() => onSendMessage(`Build my trip to ${event.name}`)}
                className="w-full text-left bg-gradient-to-r from-amber-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-700 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-700 hover:border-purple-400 transition-all group"
              >
                <div className="flex items-start gap-3">
                  {event.image && (
                    <img src={event.image} alt={event.name} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1">{event.name}</h4>
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
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== LOADING INDICATOR ====================

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl px-5 py-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Agent thinking...</span>
        </div>
      </div>
    </div>
  );
}

// ==================== CART SIDEBAR ====================

function CartSidebar({ cart, total, onClose }: { cart: CartItem[]; total: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: 0 }}
      exit={{ x: 300 }}
      className="w-96 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6 ml-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Your Trip</h3>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-sm">{item.name}</h4>
              <span className="text-lg font-bold text-purple-600">${item.price}</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">via {item.provider}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between mb-4">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-bold text-purple-600">${total.toFixed(2)}</span>
        </div>
        <button className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-bold rounded-xl">
          Checkout
        </button>
      </div>
    </motion.div>
  );
}