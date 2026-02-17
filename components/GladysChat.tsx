// components/GladysChat.tsx
// 🎨 GLADYS CHAT UI - UPDATED FOR OPENAI AGENT

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Mic, MicOff, Brain, Loader2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any; // Structured response from agent
  timestamp: Date;
}

export default function GladysChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call OpenAI agent API
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {}
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Agent failed');
      }

      const agentData = result.data;

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: agentData.message || 'Response received',
        data: agentData,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      
      const errorMsg: Message = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 shadow-2xl flex items-center justify-center"
        >
          <Brain className="text-white" size={32} />
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
              className="w-full max-w-4xl h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-zinc-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center">
                      <Brain className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Gladys AI Agent</h3>
                      <p className="text-sm text-zinc-600">Event-First Travel Intelligence</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-3 rounded-xl hover:bg-white/50 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <MessageBubble key={idx} message={message} />
                ))}
                {loading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 bg-white/70 dark:bg-zinc-900/70 border-t border-zinc-200">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Find events, compare prices, or build a trip..."
                    className="flex-1 h-14 px-6 bg-white dark:bg-zinc-800 border-2 border-zinc-200 rounded-xl focus:border-purple-400 outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="p-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white rounded-xl disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const data = message.data;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
        isUser
          ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white'
          : 'bg-white dark:bg-zinc-800 border border-zinc-200'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {/* Render structured data */}
        {!isUser && data && (
          <div className="mt-4 space-y-3">
            {/* Hotels */}
            {data.hotels && data.hotels.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">🏨 Hotels</h4>
                {data.hotels.slice(0, 3).map((hotel: any, i: number) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-700 p-3 rounded-lg mb-2">
                    <p className="font-semibold">{hotel.name}</p>
                    <p className="text-sm">⭐ {hotel.rating}/5 • ${hotel.price_estimate}</p>
                    <a href={hotel.affiliate_url} target="_blank" className="text-purple-600 text-xs">View →</a>
                  </div>
                ))}
              </div>
            )}
            
            {/* Flights */}
            {data.flights && data.flights.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">✈️ Flights</h4>
                {data.flights.slice(0, 3).map((flight: any, i: number) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-700 p-3 rounded-lg mb-2">
                    <p className="font-semibold">{flight.route}</p>
                    <p className="text-sm">${flight.price_estimate}</p>
                    <a href={flight.affiliate_url} target="_blank" className="text-purple-600 text-xs">Book →</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl px-5 py-4 border border-zinc-200">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-purple-600" size={20} />
          <span className="text-sm text-zinc-600">Agent thinking...</span>
        </div>
      </div>
    </div>
  );
}