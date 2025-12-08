import { Send, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { chatWithNutritionist } from "../services/geminiService";
import { t } from "../translations";
import { ChatMessage, UserProfile } from "../types";
import { Mascot } from "./Mascot";

interface ChatCoachProps {
  profile: UserProfile;
}

export const ChatCoach: React.FC<ChatCoachProps> = ({ profile }) => {
  const lang = profile.language || "ru";
  const text = t[lang].chat;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      setMessages([
        {
          id: "welcome",
          role: "model",
          text: text.welcome
            .replace("{name}", profile.name)
            .replace("{goal}", profile.goals.toLowerCase()),
          timestamp: Date.now(),
        },
      ]);
    }
  }, [profile.name, profile.goals, text.welcome]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const responseText = await chatWithNutritionist(
        history,
        userMsg.text,
        profile
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseText || text.error,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: text.connectionError,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto relative pt-safe">
      <div
        className="flex-1 overflow-y-auto p-4 space-y-6 pb-40"
        ref={scrollRef}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${
                  isUser
                    ? "bg-slate-200 border-white text-slate-600"
                    : "bg-teal-50 border-teal-100"
                }`}
              >
                {isUser ? (
                  <User size={18} />
                ) : (
                  // @ts-ignore
                  <Mascot mood="happy" size={32} />
                )}
              </div>
              <div
                className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-slate-800 text-white rounded-br-none"
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 shadow-sm">
              {/* @ts-ignore */}
              <Mascot mood="thinking" size={32} />
            </div>
            <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-bl-none shadow-sm border border-slate-100">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-safe-nav left-0 right-0 p-4 max-w-lg mx-auto z-40">
        <div className="glass rounded-full p-2 pr-2 pl-6 flex gap-3 shadow-xl shadow-slate-200/50 border border-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={text.placeholder}
            className="flex-1 bg-transparent border-none py-3 focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white w-12 h-12 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
