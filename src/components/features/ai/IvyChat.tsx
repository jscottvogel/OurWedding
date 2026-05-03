'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, User, Loader2, Paperclip } from 'lucide-react';
import { useWedding } from '@/lib/hooks/useWedding';
import { useChecklist } from '@/lib/hooks/useChecklist';
import { useVendors } from '@/lib/hooks/useVendors';
import { useRunSheet } from '@/lib/hooks/useRunSheet';
import { useGallery } from '@/lib/hooks/useGallery';
import { useWebsiteContent } from '@/lib/hooks/useWebsiteContent';
import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useGuests } from '@/lib/hooks/useGuests';
import { useBudget } from '@/lib/hooks/useBudget';
import { useGuestbook } from '@/lib/hooks/useGuestbook';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
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
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [documentKey, setDocumentKey] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { wedding } = useWedding();
  const { tasks, addTask, updateTask, deleteTask } = useChecklist();
  const { vendors, addVendor, updateVendor, deleteVendor } = useVendors();
  const { blocks, insertNewBlock, updateItem: updateRunsheetItem, deleteItem: deleteRunsheetItem, clearRunsheet, processIvyActions } = useRunSheet();
  const { photos } = useGallery();
  const website = useWebsiteContent();
  const { config: websiteConfig, updateConfig } = useWebsiteConfig();
  const { guests, addGuest, updateGuest, deleteGuest } = useGuests();
  const { items: budgetItems, addItem: addBudgetItem, updateItem: updateBudgetItem, deleteItem: deleteBudgetItem } = useBudget();
  const { entries: guestbookEntries, deleteEntry: deleteGuestbookEntry } = useGuestbook();
  
  const runsheet = blocks.flatMap(b => b.items);
  const addRunsheetItem = async (item: any) => {
    await insertNewBlock(blocks.length, item);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = dataUrl.split(',')[1];
          
          setImageBase64(base64Data);
          setImagePreviewUrl(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.xlsx')) {
      // Document upload
      setIsUploadingDoc(true);
      const timestamp = new Date().getTime();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `chat/${timestamp}-${safeName}`;
      
      try {
        await uploadData({
          path: key,
          data: file
        }).result;
        setDocumentKey(key);
        setDocumentName(file.name);
      } catch (err) {
        console.error('Failed to upload document', err);
      } finally {
        setIsUploadingDoc(false);
      }
    }
    
    // Clear input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setImageBase64(null);
    setImagePreviewUrl(null);
    setDocumentKey(null);
    setDocumentName(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !imageBase64 && !documentKey) || isTyping || isUploadingDoc) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input || (documentName ? `Attached document: ${documentName}` : 'Attached an image.') };
    setMessages(prev => [...prev, userMsg]);
    
    const imageToSend = imageBase64;
    const documentToSend = documentKey;
    
    setInput('');
    removeAttachment();
    setIsTyping(true);

    try {
      // Compress the full state to save AI tokens
      // We inject a lightweight summary of gallery photos so Ivy knows the IDs and current captions.
      const fullContext = {
        ...wedding,
        checklist: tasks.map(t => ({ id: t.id, title: t.title, status: t.isCompleted ? 'done' : 'pending', category: t.category })),
        vendors: vendors.map(v => ({ id: v.id, name: v.companyName, category: v.category, status: v.contractStatus })),
        runsheet: runsheet.map((r: any) => ({ id: r.id, title: r.title, time: r.eventTime })),
        gallery: photos.map(p => ({ id: p.id, uploader: p.uploaderName, caption: p.caption || '' })),
        guests: guests.map(g => ({ id: g.id, firstName: g.firstName, lastName: g.lastName, rsvpStatus: g.rsvpStatus, partyId: g.partyId, mealChoice: g.mealChoice, dietaryRestrictions: g.dietaryRestrictions })),
        budget: budgetItems.map(b => ({ id: b.id, expenseName: b.expenseName, amount: b.amount, category: b.category, isPaid: b.isPaid })),
        guestbook: guestbookEntries.map(e => ({ id: e.id, guestName: e.guestName, message: e.message, isApproved: e.isApproved })),
        website: {
          ...website,
          config: websiteConfig
        }
      };

      // Pass the full conversation history and wedding context
      const response = await client.mutations.askIvy({
        message: userMsg.content,
        weddingContext: JSON.stringify(fullContext),
        conversationHistory: JSON.stringify(messages),
        imageBase64: imageToSend || undefined,
        documentKey: documentToSend || undefined
      });
      
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      const responseData = response.data || '';

      if (responseData.startsWith('[TOOL_CALL]') || responseData.startsWith('[TOOL_CALLS]')) {
        const isMultiple = responseData.startsWith('[TOOL_CALLS]');
        const toolJson = responseData.replace(isMultiple ? '[TOOL_CALLS] ' : '[TOOL_CALL] ', '');
        const parsedData = JSON.parse(toolJson);
        const toolCalls = isMultiple ? parsedData : [parsedData];
        
        let addedCount = 0;
        let lastActionMessage = "I've handled that for you!";
        
        const runsheetActions = [];

        for (const toolCall of toolCalls) {
          if (toolCall.name === 'add_task') {
            await addTask({
              title: toolCall.input.title,
              category: toolCall.input.category as any,
              isCompleted: false,
              isTemplate: false,
              sortOrder: 0
            });
            lastActionMessage = `I've successfully added "${toolCall.input.title}" to your checklist!`;
            addedCount++;
          } else if (toolCall.name === 'update_task') {
            await updateTask(toolCall.input.id, toolCall.input.updates);
            lastActionMessage = "I've updated that task for you!";
          } else if (toolCall.name === 'delete_task') {
            await deleteTask(toolCall.input.id);
            lastActionMessage = "I've removed that task from your checklist!";
          } else if (toolCall.name === 'add_vendor') {
            await addVendor({
              companyName: toolCall.input.companyName,
              category: toolCall.input.category,
              contractStatus: 'NOT_STARTED',
              depositPaid: false,
              balancePaid: false,
              portalAccess: false
            });
            lastActionMessage = `I've added "${toolCall.input.companyName}" to your vendors list!`;
            addedCount++;
          } else if (toolCall.name === 'update_vendor') {
            await updateVendor(toolCall.input.id, toolCall.input.updates);
            lastActionMessage = "I've updated that vendor's details!";
          } else if (toolCall.name === 'delete_vendor') {
            await deleteVendor(toolCall.input.id);
            lastActionMessage = "I've removed that vendor from your list!";
          } else if (toolCall.name === 'update_story') {
            if (website.story) {
              await client.models.WebsiteStory.update({ id: website.story.id, coupleStory: toolCall.input.coupleStory });
            } else if (wedding?.id) {
              await client.models.WebsiteStory.create({ weddingId: wedding.id, coupleStory: toolCall.input.coupleStory });
            }
            lastActionMessage = "I've updated your story on the website!";
          } else if (toolCall.name === 'add_travel_item') {
            if (wedding?.id) await client.models.WebsiteTravel.create({ weddingId: wedding.id, hotelName: toolCall.input.hotelName, address: toolCall.input.address, bookingUrl: toolCall.input.bookingUrl, notes: toolCall.input.notes, isVisible: true });
            lastActionMessage = `I've added ${toolCall.input.hotelName} to the travel section!`;
            addedCount++;
          } else if (toolCall.name === 'add_party_member') {
            if (wedding?.id) await client.models.WebsitePartyMember.create({ weddingId: wedding.id, name: toolCall.input.name, role: toolCall.input.role as any, bio: toolCall.input.bio, isVisible: true });
            lastActionMessage = `I've added ${toolCall.input.name} to the wedding party!`;
            addedCount++;
          } else if (toolCall.name === 'add_registry') {
            if (wedding?.id) await client.models.WebsiteRegistry.create({ weddingId: wedding.id, registryName: toolCall.input.registryName, registryUrl: toolCall.input.registryUrl, isVisible: true });
            lastActionMessage = `I've added ${toolCall.input.registryName} to your registry!`;
            addedCount++;
          } else if (toolCall.name === 'add_faq') {
            if (wedding?.id) await client.models.WebsiteFaq.create({ weddingId: wedding.id, question: toolCall.input.question, answer: toolCall.input.answer, category: toolCall.input.category as any, isVisible: true });
            lastActionMessage = "I've added that FAQ to your website!";
            addedCount++;
          } else if (toolCall.name === 'delete_travel_item') {
            await client.models.WebsiteTravel.delete({ id: toolCall.input.id });
            lastActionMessage = "I've removed that from your travel accommodations!";
          } else if (toolCall.name === 'delete_party_member') {
            await client.models.WebsitePartyMember.delete({ id: toolCall.input.id });
            lastActionMessage = "I've removed them from the wedding party!";
          } else if (toolCall.name === 'update_website_config') {
            await updateConfig(toolCall.input.updates);
            lastActionMessage = "I've updated the website configuration for you!";
          } else if (toolCall.name === 'delete_registry') {
            await client.models.WebsiteRegistry.delete({ id: toolCall.input.id });
            lastActionMessage = "I've removed that registry link!";
          } else if (toolCall.name === 'update_travel_item') {
            await client.models.WebsiteTravel.update({ id: toolCall.input.id, ...toolCall.input.updates });
            lastActionMessage = "I've updated that travel accommodation!";
          } else if (toolCall.name === 'update_party_member') {
            await client.models.WebsitePartyMember.update({ id: toolCall.input.id, ...toolCall.input.updates });
            lastActionMessage = "I've updated the wedding party member!";
          } else if (toolCall.name === 'update_registry') {
            await client.models.WebsiteRegistry.update({ id: toolCall.input.id, ...toolCall.input.updates });
            lastActionMessage = "I've updated that registry link!";
          } else if (toolCall.name === 'update_faq') {
            await client.models.WebsiteFaq.update({ id: toolCall.input.id, ...toolCall.input.updates });
            lastActionMessage = "I've updated the FAQ!";
          } else if (toolCall.name === 'delete_faq') {
            await client.models.WebsiteFaq.delete({ id: toolCall.input.id });
            lastActionMessage = "I've deleted that FAQ!";
          } else if (toolCall.name === 'add_guest') {
            await addGuest({
              firstName: toolCall.input.firstName,
              lastName: toolCall.input.lastName,
              email: toolCall.input.email,
              rsvpStatus: toolCall.input.rsvpStatus || 'PENDING',
              partyId: toolCall.input.partyId,
              isPlusOne: false
            });
            lastActionMessage = `I've added ${toolCall.input.firstName} to your guest list!`;
            addedCount++;
          } else if (toolCall.name === 'update_guest') {
            await updateGuest(toolCall.input.id, toolCall.input.updates);
            lastActionMessage = "I've updated the guest details!";
          } else if (toolCall.name === 'delete_guest') {
            await deleteGuest(toolCall.input.id);
            lastActionMessage = "I've removed that guest from the list!";
          } else if (toolCall.name === 'add_budget_item') {
            await addBudgetItem({
              expenseName: toolCall.input.expenseName,
              amount: toolCall.input.amount,
              category: toolCall.input.category as any,
              isPaid: toolCall.input.isPaid || false,
              dueDate: toolCall.input.dueDate,
              notes: toolCall.input.notes
            });
            lastActionMessage = `I've added the ${toolCall.input.expenseName} expense to your budget!`;
            addedCount++;
          } else if (toolCall.name === 'update_budget_item') {
            await updateBudgetItem(toolCall.input.id, toolCall.input.updates);
            lastActionMessage = "I've updated the budget item!";
          } else if (toolCall.name === 'delete_budget_item') {
            await deleteBudgetItem(toolCall.input.id);
            lastActionMessage = "I've removed that expense from your budget!";
          } else if (toolCall.name === 'update_guestbook_approval') {
            await client.models.WebsiteGuestbook.update({ id: toolCall.input.id, isApproved: toolCall.input.isApproved });
            lastActionMessage = `I've ${toolCall.input.isApproved ? 'approved' : 'hidden'} that guestbook entry!`;
          } else if (toolCall.name === 'delete_guestbook_entry') {
            await deleteGuestbookEntry(toolCall.input.id);
            lastActionMessage = "I've permanently deleted that guestbook entry.";
          } else if (toolCall.name === 'update_wedding_details') {
            if (wedding?.id) {
               await client.models.Wedding.update({ id: wedding.id, ...toolCall.input.updates });
            }
            lastActionMessage = "I've updated your core wedding details!";
          } else if (['add_runsheet_item', 'update_runsheet_item', 'delete_runsheet_item', 'clear_runsheet', 'update_gallery_caption'].includes(toolCall.name)) {
            runsheetActions.push(toolCall);
            if (toolCall.name === 'add_runsheet_item') {
              lastActionMessage = `I've added "${toolCall.input.title}" to your run sheet at ${toolCall.input.eventTime}!`;
              addedCount++;
            } else if (toolCall.name === 'update_runsheet_item') {
              lastActionMessage = "I've updated that run sheet item!";
            } else if (toolCall.name === 'delete_runsheet_item') {
              lastActionMessage = "I've removed that item from your run sheet!";
            } else if (toolCall.name === 'clear_runsheet') {
              lastActionMessage = "I've cleared out your entire run sheet. You're ready to start fresh!";
            } else if (toolCall.name === 'update_gallery_caption') {
              await client.models.GalleryUpload.update({
                id: toolCall.input.id,
                caption: toolCall.input.caption
              });
              lastActionMessage = "I've updated the caption on that photo!";
            }
          }
        }
        
        if (runsheetActions.length > 0) {
          await processIvyActions(runsheetActions);
        }
        
        let finalMessage = lastActionMessage;
        if (addedCount > 1) {
          finalMessage = `I've successfully generated and added ${addedCount} items for you!`;
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalMessage
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
          {(imagePreviewUrl || documentName) && (
            <div className="mb-3 relative inline-block bg-ivory rounded-md border border-light-gray pr-6 p-2">
              {imagePreviewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imagePreviewUrl} alt="Preview" className="h-16 rounded-md object-cover" />
              ) : (
                <div className="flex items-center text-sm text-sage font-medium">
                  <Paperclip className="w-4 h-4 mr-2" />
                  {documentName}
                </div>
              )}
              <button 
                onClick={removeAttachment}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-ivory text-sage rounded-full flex items-center justify-center hover:bg-sage/10 transition-colors border border-sage/20 flex-shrink-0"
              disabled={isTyping || isUploadingDoc}
            >
              {isUploadingDoc ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
              className="hidden" 
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 border border-light-gray rounded-full px-4 py-2 text-sm focus:border-sage focus:outline-none min-w-0"
              disabled={isTyping || isUploadingDoc}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !imageBase64 && !documentKey) || isTyping || isUploadingDoc}
              className="w-10 h-10 bg-sage text-white rounded-full flex items-center justify-center hover:bg-dark-sage disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
