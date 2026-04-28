'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User, Loader2 } from 'lucide-react';
import { useWedding } from '@/lib/hooks/useWedding';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function IvyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! I\'m Ivy, your wedding planning assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { wedding } = useWedding();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass the full conversation history and wedding context
      const response = await client.mutations.askIvy({
        message: userMsg.content,
        weddingContext: JSON.stringify(wedding)
      });
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data || 'Sorry, I got an empty response.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting to my brain right now. Please try again later!'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-sage text-white rounded-full shadow-lg flex items-center justify-center hover:bg-dark-sage transition-all z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Ask Ivy"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-light-gray flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-sage p-4 rounded-t-2xl flex justify-between items-center text-white">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg leading-none">Ivy</h3>
              <p className="text-xs text-white/80 mt-1">AI Planning Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ivory/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-charcoal text-white ml-2' : 'bg-sage text-white mr-2'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-white border border-light-gray text-charcoal rounded-tr-sm' : 'bg-ivory border border-sage/20 text-charcoal rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-sage text-white mr-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-ivory border border-sage/20 text-charcoal rounded-tl-sm flex space-x-1 items-center h-10">
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-light-gray rounded-b-2xl">
          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 border border-light-gray rounded-full px-4 py-2 text-sm focus:border-sage focus:outline-none"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-sage text-white rounded-full flex items-center justify-center hover:bg-dark-sage disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
