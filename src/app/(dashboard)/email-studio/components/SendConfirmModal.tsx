'use client';

import { useState } from 'react';
import { useEmailStudio } from './EmailStudioProvider';
import { AlertTriangle, Send, X, Loader2 } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function SendConfirmModal({ onClose }: { onClose: () => void }) {
  const { 
    activeType, 
    subjectLine, 
    paletteKey, 
    personalNote, 
    customContent,
    selectedGuestIds,
    manualEmails,
    draftCampaignId,
    refreshCampaigns
  } = useEmailStudio();

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ sent: number; failed: number } | null>(null);

  const parsedManualEmails = manualEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
  const totalRecipients = selectedGuestIds.length + parsedManualEmails.length;

  const handleSend = async () => {
    if (totalRecipients === 0) {
      setError('No recipients selected.');
      return;
    }
    if (!draftCampaignId) {
      setError('Draft campaign not found. Please wait for auto-save.');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      // For selected guests, we need their emails. Actually, the Lambda requires recipientEmails.
      // So let's fetch the guests real quick or rely on the Lambda fetching them.
      // Wait, our Lambda takes recipientEmails. We should pass the emails!
      // To do this properly, the frontend can query the guests.
      const { data: guests } = await client.models.Guest.list();
      const guestEmails = guests
        .filter(g => selectedGuestIds.includes(g.id) && g.email)
        .map(g => g.email as string);

      const allEmails = Array.from(new Set([...guestEmails, ...parsedManualEmails]));

      if (allEmails.length === 0) {
        throw new Error('None of the selected recipients have valid email addresses.');
      }

      const result = await client.mutations.sendWeddingEmail({
        campaignId: draftCampaignId,
        recipientEmails: allEmails,
        guestIds: selectedGuestIds,
        emailType: activeType,
        subjectLine: subjectLine || 'Wedding Steward Notification',
        paletteKey: paletteKey,
        personalNote,
        customContent
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      if (result.data) {
        setStats({ sent: result.data.sentCount || 0, failed: result.data.failedCount || 0 });
        setSuccess(true);
        refreshCampaigns();
      } else {
        throw new Error('No response from send operation.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while sending emails.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          disabled={isSending}
          className="absolute top-4 right-4 text-mid-gray hover:text-charcoal disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-display font-bold text-charcoal mb-4">
            {success ? 'Emails Sent!' : 'Review & Send'}
          </h2>

          {success && stats ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-sage" />
              </div>
              <p className="text-charcoal mb-2 font-medium">Your campaign is on its way.</p>
              <p className="text-sm text-mid-gray">
                Successfully sent {stats.sent} emails. 
                {stats.failed > 0 && <span className="text-red-500 ml-1">({stats.failed} failed)</span>}
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2 bg-sage hover:bg-dark-sage text-white rounded-md font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b border-light-gray">
                  <span className="text-sm text-mid-gray">Campaign Type</span>
                  <span className="text-sm font-medium text-charcoal capitalize">{activeType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-light-gray">
                  <span className="text-sm text-mid-gray">Subject Line</span>
                  <span className="text-sm font-medium text-charcoal truncate max-w-[200px]">{subjectLine || '(No subject)'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-light-gray">
                  <span className="text-sm text-mid-gray">Total Recipients</span>
                  <span className="text-sm font-medium text-charcoal">{totalRecipients}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-start">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={isSending || totalRecipients === 0}
                className="w-full flex items-center justify-center py-3 bg-sage hover:bg-dark-sage text-white rounded-md font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Confirm & Send Now
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-mid-gray mt-4">
                Note: Emails cannot be unsent once confirmed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
