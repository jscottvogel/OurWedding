'use client';

import { useEmailStudio } from './EmailStudioProvider';
import PalettePicker from './PalettePicker';
import RecipientSelector from './RecipientSelector';
import SendConfirmModal from './SendConfirmModal';
import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function ComposePanel() {
  const { 
    subjectLine, setSubjectLine, 
    personalNote, setPersonalNote, 
    customContent, setCustomContent,
    activeType
  } = useEmailStudio();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultSubject = {
    'save_the_date': 'Save the Date!',
    'invitation': "You're Invited!",
    'rsvp_reminder': "Don't forget to RSVP!",
    'event_reminder_1': 'Wedding Update',
    'event_reminder_2': 'Final Wedding Details',
    'thank_you': 'Thank You',
  }[activeType] || '';

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 space-y-6 pb-20">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Subject Line</label>
          <input
            type="text"
            value={subjectLine}
            onChange={(e) => setSubjectLine(e.target.value)}
            placeholder={defaultSubject}
            className="w-full text-sm rounded-md border-light-gray shadow-sm focus:border-sage focus:ring-sage"
          />
        </div>

        <PalettePicker />
        <RecipientSelector />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-charcoal">Personal Note</label>
            <button className="text-xs text-sage flex items-center hover:text-dark-sage">
              <Sparkles className="w-3 h-3 mr-1" />
              Ask Ivy to help
            </button>
          </div>
          <textarea
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Add a sweet opening note (optional)..."
            className="w-full text-sm rounded-md border-light-gray shadow-sm focus:border-sage focus:ring-sage resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Custom Content Block</label>
          <textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Add any extra details, links, or instructions (optional)..."
            className="w-full text-sm rounded-md border-light-gray shadow-sm focus:border-sage focus:ring-sage resize-none"
            rows={4}
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-light-gray pt-4 pb-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center px-4 py-3 bg-sage hover:bg-dark-sage text-white rounded-md font-medium shadow-sm transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          Review & Send
        </button>
      </div>

      {isModalOpen && <SendConfirmModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
