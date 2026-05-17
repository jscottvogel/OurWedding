'use client';

import { useEmailStudio } from './EmailStudioProvider';
import { useWedding } from '@/lib/hooks/useWedding';
import { renderEmailHtml } from '../../../../../amplify/functions/send-wedding-email/templates';
import { useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';

const client = generateClient<Schema>();

export default function EmailPreviewPanel() {
  const { wedding } = useWedding();
  const { 
    activeType, 
    paletteKey, 
    personalNote, 
    customContent,
    subjectLine,
    draftCampaignId
  } = useEmailStudio();

  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState('');

  const htmlContent = useMemo(() => {
    if (!wedding) return '';

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return undefined;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const isDateOnly = dateStr.length <= 10 || !dateStr.includes('T');
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: isDateOnly ? 'UTC' : undefined
        });
      } catch {
        return dateStr;
      }
    };

    const formatTime = (timeStr?: string, tz?: string) => {
      if (!timeStr) return undefined;
      try {
        const [hourStr, minStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        const timeFmt = `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
        return tz ? `${timeFmt} ${tz}` : timeFmt;
      } catch {
        return timeStr;
      }
    };

    const weddingData = {
      coupleName1: wedding.coupleName1 || 'Partner 1',
      coupleName2: wedding.coupleName2 || 'Partner 2',
      date: formatDate(wedding.weddingDate),
      time: formatTime(wedding.weddingTime, wedding.timezone || undefined),
      venue: wedding.venueName || undefined,
      city: wedding.venueAddress || undefined, // mapping venueAddress to city field in templates
      rsvpDate: formatDate(wedding.rsvpDeadline),
      websiteUrl: wedding.websiteEnabled && wedding.slug ? `https://${wedding.slug}.weddingsteward.com` : undefined,
    };

    return renderEmailHtml({
      emailType: activeType,
      weddingData,
      paletteKey,
      personalNote,
      customContent
    });
  }, [wedding, activeType, paletteKey, personalNote, customContent]);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setTestError('Please enter a valid email address.');
      return;
    }
    if (!draftCampaignId) {
      setTestError('Waiting for draft to save. Please try again in a moment.');
      return;
    }

    setIsSendingTest(true);
    setTestError('');
    setTestSent(false);

    try {
      const result = await client.mutations.sendWeddingEmail({
        campaignId: draftCampaignId,
        recipientEmails: [testEmail],
        guestIds: [],
        emailType: activeType,
        subjectLine: subjectLine || `Test: ${activeType}`,
        paletteKey: paletteKey,
        personalNote,
        customContent,
        isTest: true
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      
      setTestSent(true);
      setTimeout(() => setTestSent(false), 5000);
    } catch (e: any) {
      setTestError(e.message || 'Failed to send test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center w-full max-w-[600px]">
      {/* Test Email Bar */}
      <div className="w-full bg-white p-3 rounded-t-sm border border-b-0 border-light-gray shadow-sm flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <input 
            type="email" 
            placeholder="Enter email address for test"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 text-sm rounded-md border-light-gray focus:ring-sage focus:border-sage py-1.5"
          />
          <button 
            onClick={handleSendTest}
            disabled={isSendingTest || !testEmail}
            className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-charcoal rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSendingTest ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            Send Test
          </button>
        </div>
        {testSent && (
          <div className="flex items-center text-xs text-sage font-medium whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Sent!
          </div>
        )}
        {testError && (
          <div className="text-xs text-red-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={testError}>
            {testError}
          </div>
        )}
      </div>

      {/* Preview Box */}
      <div className="w-full bg-white shadow-lg border border-light-gray rounded-b-sm flex flex-col overflow-hidden flex-1">
        <div className="bg-gray-100 border-b border-light-gray px-4 py-2 flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs text-mid-gray ml-2">Preview (600px width)</span>
        </div>
        <div className="flex-1 bg-white overflow-y-auto">
          {/* Render HTML content safely since it's generated locally by our template engine */}
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="w-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
