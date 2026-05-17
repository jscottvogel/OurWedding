'use client';

import { useEmailStudio, EmailType } from './EmailStudioProvider';
import { Calendar, Mail, AlertCircle, Clock, CheckCircle2, Heart } from 'lucide-react';

const EMAIL_TYPES: { id: EmailType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'save_the_date', label: 'Save the Date', icon: Calendar, desc: '6-12 months before' },
  { id: 'invitation', label: 'Formal Invitation', icon: Mail, desc: '6-8 weeks before' },
  { id: 'rsvp_reminder', label: 'RSVP Reminder', icon: AlertCircle, desc: '1-2 weeks before deadline' },
  { id: 'event_reminder_1', label: 'Event Reminder 1', icon: Clock, desc: '~1 month before' },
  { id: 'event_reminder_2', label: 'Event Reminder 2', icon: Clock, desc: '~1 week before' },
  { id: 'thank_you', label: 'Thank You', icon: Heart, desc: '1-2 weeks after' },
];

export default function EmailTypeSidebar() {
  const { activeType, setActiveType, campaigns } = useEmailStudio();

  return (
    <div className="flex overflow-x-auto">
      {EMAIL_TYPES.map((type) => {
        const isActive = activeType === type.id;
        const Icon = type.icon;
        
        // Find if there is a sent campaign for this type
        const sentCampaigns = campaigns.filter(c => c.emailType === type.id && c.status === 'sent');
        const hasSent = sentCampaigns.length > 0;

        return (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`flex flex-col items-center justify-center min-w-[120px] px-4 py-3 transition-colors border-b-2 shrink-0 ${
              isActive 
                ? 'bg-light-sage/10 border-sage text-sage' 
                : 'border-transparent text-mid-gray hover:bg-gray-50 hover:text-charcoal'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Icon className="w-4 h-4 shrink-0" />
              <span className={`font-medium text-sm ${isActive ? 'text-charcoal' : ''}`}>
                {type.label}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">
              {type.desc}
            </div>
            {hasSent && (
              <div className="flex items-center text-[10px] text-sage mt-1 font-medium">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
