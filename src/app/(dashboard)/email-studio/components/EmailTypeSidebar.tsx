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
    <div className="py-4">
      <div className="px-4 mb-4 text-xs font-semibold text-mid-gray uppercase tracking-wider">
        Email Types
      </div>
      <ul className="space-y-1">
        {EMAIL_TYPES.map((type) => {
          const isActive = activeType === type.id;
          const Icon = type.icon;
          
          // Find if there is a sent campaign for this type
          const sentCampaigns = campaigns.filter(c => c.emailType === type.id && c.status === 'sent');
          const hasSent = sentCampaigns.length > 0;

          return (
            <li key={type.id}>
              <button
                onClick={() => setActiveType(type.id)}
                className={`w-full flex items-start px-4 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-light-sage/30 border-l-4 border-sage' 
                    : 'border-l-4 border-transparent hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${isActive ? 'text-sage' : 'text-mid-gray'}`} />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${isActive ? 'text-charcoal' : 'text-mid-gray'}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-mid-gray mt-0.5">{type.desc}</div>
                  {hasSent && (
                    <div className="flex items-center text-xs text-sage mt-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
