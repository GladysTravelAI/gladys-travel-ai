"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
  name?: string;
  preferredCities: string[];
  budget: 'budget' | 'moderate' | 'luxury';
  recentQueries: string[];
  conversationCount: number;
  travelStyle?: string;
  upcomingTrips?: any[];
  favoriteTeam?: string;
  matchesInterested?: string[];
}

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
  const [userContext, setUserContext] = useState<UserContext>({
    preferredCities: [],
    budget: 'moderate',
    recentQueries: [],
    conversationCount: 0,
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
      };

      if (savedContext) {
        context = JSON.parse(savedContext);
        setUserContext(context);
      }

      let greeting = '';
      if (context.name) {
        const greetings = [
          `Hey ${context.name}! 👋 Ready to plan your next adventure?`,
          `Welcome back, ${context.name}! ✨ Let's make some travel magic!`,
          `Hi ${context.name}! ✈️ Where should we explore today?`,
        ];
        greeting = greetings[Math.floor(Math.random() * greetings.length)];
      } else if (context.conversationCount > 0) {
        greeting = `Welcome back! ✨ Ready to explore more amazing places?`;
      } else {
        greeting = `Hey there! 👋 I'm Gladys, your AI travel companion!\n\nI can help you:\n✈️ Plan trips and find hotels\n🎫 Find events and tickets\n🗺️ Create perfect itineraries\n\nWhat's your name? I'd love to get to know you! 😊`;
      }

      setMessages([
        {
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    };

    initializeGladys();

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gladys-user-context', JSON.stringify(userContext));
  }, [userContext]);

  useEffect(() => {
    localStorage.setItem('gladys-messages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
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
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const executeTool = (toolCall: any) => {
    if (!toolCall || toolCall.type !== 'function') return;

    const { name, arguments: argsString } = toolCall.function;
    let args: any;

    try {
      args = JSON.parse(argsString);
    } catch (e) {
      console.error("Failed to parse tool arguments:", e);
      return;
    }

    console.log(`🔧 Executing tool: ${name}`, args);

    switch (name) {
      case 'navigate_to_page':
        if (args.url) {
          router.push(args.url);
          setIsOpen(false);
        }
        break;

      case 'show_map_route':
        if (onShowMaps && args.from && args.to) {
          onShowMaps(args.from, args.to);
        }
        break;

      case 'apply_filters':
        if (onAction) {
          onAction('apply_filters', args);
        }
        break;

      default:
        console.warn(`Unknown tool called: ${name}`);
    }
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
      const response = await fetch('/api/gladys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          userContext: userContext,
          currentDestination: currentDestination,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      setUserContext((prev) => {
        const updated = { ...prev };
        if (data.updatedContext) {
          Object.assign(updated, data.updatedContext);
        }
        updated.recentQueries = [userMessage, ...updated.recentQueries].slice(0, 10);
        updated.conversationCount += 1;
        return updated;
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response_text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (voiceEnabled && !data.fallback && data.response_text) {
        speak(data.response_text);
      }

      if (data.tool_call) {
        executeTool(data.tool_call);
      }

    } catch (error) {
      console.error('Error communicating with Gladys:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Oops! I'm having a moment here. 😅 My connection got a bit wobbly. Can you try asking me that again?",
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

  return (
    <>
      {/* Siri-Style Floating Orb Button - MOBILE OPTIMIZED */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 group"
          aria-label="Open Gladys AI Assistant"
        >
          {/* Outer glow rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-75 blur-xl animate-pulse-slow"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-60 blur-2xl animate-pulse-slower"></div>

          {/* Main orb - Responsive sizing: 56px mobile, 80px desktop */}
          <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
            {/* Inner gradient layers */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-70 animate-spin-slow"></div>
            <div className="absolute inset-3 md:inset-4 rounded-full bg-gradient-to-br from-white/40 to-transparent backdrop-blur-sm"></div>

            {/* Sparkle Icon - Responsive sizing */}
            <Sparkles className="relative z-10 text-white drop-shadow-lg w-6 h-6 md:w-9 md:h-9" />
          </div>

          {/* Floating particles - Hidden on mobile */}
          <div className="hidden md:block absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-float-1 opacity-60"></div>
          <div className="hidden md:block absolute -bottom-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-float-2 opacity-60"></div>
          <div className="hidden md:block absolute top-1/2 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-float-3 opacity-60"></div>
        </button>
      )}

      {/* Siri-Style Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl h-[85vh] flex flex-col">

            {/* Glassmorphic Card */}
            <div className="flex-1 flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b border-white/10">
                {/* Animated background orb */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-20 blur-3xl rounded-full animate-pulse-slow"></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Siri Orb Avatar */}
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 opacity-80 blur-md animate-pulse-slow"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-70 animate-spin-slow"></div>
                        <Sparkles className="relative z-10 text-white" size={28} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                        Gladys AI
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userContext.name ? `Chat with ${userContext.name}` : 'Your Travel Companion'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 backdrop-blur-sm transition-all"
                      aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
                    >
                      {voiceEnabled ? (
                        <Volume2 size={20} className="text-purple-600" />
                      ) : (
                        <VolumeX size={20} className="text-gray-400" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 backdrop-blur-sm transition-all"
                      aria-label="Close chat"
                    >
                      <X size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg'
                          : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-md text-gray-900 dark:text-gray-100 shadow-md border border-white/20'
                      } rounded-3xl px-6 py-4`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
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
                      placeholder={isListening ? "🎙️ Listening..." : "Ask me anything..."}
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-10px, -15px);
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(10px, 15px);
          }
        }

        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-15px, 10px);
          }
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
      `}</style>
    </>
  );
}