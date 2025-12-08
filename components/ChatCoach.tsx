import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { chatWithNutritionist } from '../services/geminiService';
import { Send, Bot, User } from 'lucide-react';
import { t } from '../translations';

interface ChatCoachProps {
  profile: UserProfile;
}

export const ChatCoach: React.FC<ChatCoachProps> = ({ profile }) => {
  const lang = profile.language || 'ru';
  const text = t[lang].chat;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
        initRef.current = true;
        setMessages([{
            id: 'welcome',
            role: 'model',
            text: text.welcome.replace('{name}', profile.name).replace('{goal}', profile.goals.toLowerCase()),
            timestamp: Date.now()
        }]);
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
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithNutritionist(history, userMsg.text, profile);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || text.error,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text.connectionError,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32" ref={scrollRef}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isUser ? 'bg-slate-200 text-slate-600' : 'bg-teal-100 text-teal-600'
              }`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                isUser 
                  ? 'bg-slate-800 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-teal-600" />
             </div>
             <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-safe-nav left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-lg mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={text.placeholder}
            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-3 rounded-full transition-colors flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};