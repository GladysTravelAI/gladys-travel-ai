"use client";

import { useState, useRef, useEffect } from "react";

type Message = { type: "user" | "ai"; text: string };

export default function ChatDialogue() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak AI message
  const speakText = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();
      const aiMessage: Message = { type: "ai", text: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
      speakText(data.reply); // optional voice output
    } catch (err) {
      console.error(err);
      alert("Failed to get AI response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Chat Window */}
      <div className="h-[400px] overflow-y-auto border rounded-xl p-4 space-y-3 bg-white shadow-md">
        {messages.map((msg, i) => (
          <div key={i} className={msg.type === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block p-3 rounded-lg ${msg.type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 rounded-lg border"
          placeholder="Ask something about your trip..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
}