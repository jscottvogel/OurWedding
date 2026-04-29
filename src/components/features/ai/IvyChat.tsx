'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User, Loader2 } from 'lucide-react';
import { useWedding } from '@/lib/hooks/useWedding';
import { useChecklist } from '@/lib/hooks/useChecklist';
import { useVendors } from '@/lib/hooks/useVendors';
import { useRunSheet } from '@/lib/hooks/useRunSheet';
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
  const { tasks, addTask, updateTask, deleteTask } = useChecklist();
  const { vendors, addVendor, updateVendor, deleteVendor } = useVendors();
  const { items: runsheet, addItem: addRunsheetItem, updateItem: updateRunsheetItem, deleteItem: deleteRunsheetItem } = useRunSheet();

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
      // Compress the full state to save AI tokens
      const fullContext = {
        ...wedding,
        checklist: tasks.map(t => ({ id: t.id, title: t.title, status: t.isCompleted ? 'done' : 'pending', category: t.category })),
        vendors: vendors.map(v => ({ id: v.id, name: v.companyName, category: v.category, status: v.contractStatus })),
        runsheet: runsheet.map(r => ({ id: r.id, title: r.title, time: r.eventTime }))
      };

      // Pass the full conversation history and wedding context
      const response = await client.mutations.askIvy({
        message: userMsg.content,
        weddingContext: JSON.stringify(fullContext),
        conversationHistory: JSON.stringify(messages)
      });
      
      console.log("IVY RAW RESPONSE:", response);

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      const responseData = response.data || '';

      if (responseData.startsWith('[TOOL_CALL]')) {
        const toolJson = responseData.replace('[TOOL_CALL] ', '');
        const toolCall = JSON.parse(toolJson);
        
        let successMessage = "I've handled that for you!";
        if (toolCall.name === 'add_task') {
          await addTask({
            title: toolCall.input.title,
            category: toolCall.input.category as any,
            isCompleted: false,
            isTemplate: false,
            sortOrder: 0
          });
          successMessage = `I've successfully added "${toolCall.input.title}" to your checklist under ${toolCall.input.category}!`;
        } else if (toolCall.name === 'update_task') {
          await updateTask(toolCall.input.id, toolCall.input.updates);
          successMessage = "I've updated that task for you!";
        } else if (toolCall.name === 'delete_task') {
          await deleteTask(toolCall.input.id);
          successMessage = "I've removed that task from your checklist!";
        } else if (toolCall.name === 'add_vendor') {
          await addVendor({
            companyName: toolCall.input.companyName,
            category: toolCall.input.category,
            contractStatus: 'NOT_STARTED',
            depositPaid: false,
            balancePaid: false,
            portalAccess: false
          });
          successMessage = `I've added "${toolCall.input.companyName}" to your vendors list under ${toolCall.input.category}!`;
        } else if (toolCall.name === 'update_vendor') {
          await updateVendor(toolCall.input.id, toolCall.input.updates);
          successMessage = "I've updated that vendor's details!";
        } else if (toolCall.name === 'delete_vendor') {
          await deleteVendor(toolCall.input.id);
          successMessage = "I've removed that vendor from your list!";
        } else if (toolCall.name === 'add_runsheet_item') {
          await addRunsheetItem({
            title: toolCall.input.title,
            eventTime: toolCall.input.eventTime,
            description: toolCall.input.description,
            location: toolCall.input.location,
            durationMinutes: toolCall.input.durationMinutes,
            sortOrder: 0
          });
          successMessage = `I've added "${toolCall.input.title}" to your run sheet at ${toolCall.input.eventTime}!`;
        } else if (toolCall.name === 'update_runsheet_item') {
          await updateRunsheetItem(toolCall.input.id, toolCall.input.updates);
          successMessage = "I've updated that run sheet item!";
        } else if (toolCall.name === 'delete_runsheet_item') {
          await deleteRunsheetItem(toolCall.input.id);
          successMessage = "I've removed that item from your run sheet!";
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: successMessage
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseData || 'Sorry, I got an empty response.'
        }]);
      }
    } catch (error: any) {
      console.error("Ivy Error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting to my brain right now. (${error.message || 'Unknown error'})`
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
