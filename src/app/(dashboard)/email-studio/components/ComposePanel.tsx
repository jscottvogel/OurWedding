'use client';

import { useEmailStudio } from './EmailStudioProvider';
import PalettePicker from './PalettePicker';
import RecipientSelector from './RecipientSelector';
import SendConfirmModal from './SendConfirmModal';
import PhotoSelector from './PhotoSelector';
import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function ComposePanel() {
  const { 
    subjectLine, setSubjectLine, 
    personalNote, setPersonalNote, 
    customContent, setCustomContent,
    photoUrl, setPhotoUrl,
    overrideNames, setOverrideNames,
    activeType,
    selectedGuestIds,
    manualEmails
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

  const hasRecipients = selectedGuestIds.length > 0 || manualEmails.trim().length > 0;

  return (
    <div className="flex flex-col gap-8 pb-4">
      <RecipientSelector />

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

      {activeType === 'thank_you' && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Display Names (Optional)</label>
          <input
            type="text"
            value={overrideNames}
            onChange={(e) => setOverrideNames(e.target.value)}
            placeholder="e.g. Mr. & Mrs. Prince"
            className="w-full text-sm rounded-md border-light-gray shadow-sm focus:border-sage focus:ring-sage"
          />
          <p className="text-xs text-mid-gray mt-1">Override the default couple names for this email.</p>
        </div>
      )}

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

      <PhotoSelector photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} />

      <PalettePicker />

      <div className="pt-6 border-t border-light-gray mt-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!hasRecipients}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium shadow-sm transition-colors ${
            hasRecipients 
              ? 'bg-sage hover:bg-dark-sage text-white' 
              : 'bg-light-gray text-charcoal/50 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4 mr-2" />
          Review & Send
        </button>
        {!hasRecipients && (
          <p className="text-xs text-rose-500 text-center mt-2">Please select at least one recipient to send.</p>
        )}
      </div>

      {isModalOpen && <SendConfirmModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
