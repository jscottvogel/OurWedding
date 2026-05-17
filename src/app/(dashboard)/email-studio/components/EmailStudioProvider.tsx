'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../../amplify/data/resource';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWedding } from '@/lib/hooks/useWedding';

const client = generateClient<Schema>();

export type EmailType = 'save_the_date' | 'invitation' | 'rsvp_reminder' | 'event_reminder_1' | 'event_reminder_2' | 'thank_you';
export type PaletteKey = 'classic' | 'sage' | 'navy' | 'dusty_rose';

interface EmailStudioContextType {
  activeType: EmailType;
  setActiveType: (t: EmailType) => void;
  subjectLine: string;
  setSubjectLine: (s: string) => void;
  paletteKey: PaletteKey;
  setPaletteKey: (p: PaletteKey) => void;
  personalNote: string;
  setPersonalNote: (n: string) => void;
  customContent: string;
  setCustomContent: (c: string) => void;
  photoUrl: string;
  setPhotoUrl: (u: string) => void;
  overrideNames: string;
  setOverrideNames: (n: string) => void;
  selectedGuestIds: string[];
  setSelectedGuestIds: (ids: string[]) => void;
  manualEmails: string;
  setManualEmails: (e: string) => void;
  isSending: boolean;
  setIsSending: (b: boolean) => void;
  sendProgress: number;
  setSendProgress: (n: number) => void;
  campaigns: Array<Schema['EmailCampaign']['type']>;
  refreshCampaigns: () => void;
  draftCampaignId: string | null;
}

const EmailStudioContext = createContext<EmailStudioContextType | undefined>(undefined);

export function EmailStudioProvider({ children }: { children: ReactNode }) {
  const { weddingId } = useAuth();
  const { wedding } = useWedding();
  const [activeType, setActiveType] = useState<EmailType>('save_the_date');
  const [subjectLine, setSubjectLine] = useState('');
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('classic');
  const [personalNote, setPersonalNote] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [overrideNames, setOverrideNames] = useState('');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [campaigns, setCampaigns] = useState<Array<Schema['EmailCampaign']['type']>>([]);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);

  const refreshCampaigns = async () => {
    if (!weddingId) return;
    try {
      const { data } = await client.models.EmailCampaign.list({
        filter: { weddingId: { eq: weddingId } }
      });
      setCampaigns(data || []);
      
      const draft = data.find(c => c.status === 'draft' && c.emailType === activeType);
      
      let initialPhotoUrl = draft?.photoUrl || '';
      if (!initialPhotoUrl && activeType !== 'thank_you' && wedding?.heroImageKey) {
        try {
          const res = await getUrl({ path: wedding.heroImageKey });
          initialPhotoUrl = res.url.toString();
        } catch (e) {
          console.error('Failed to get hero image URL', e);
        }
      }

      if (draft) {
        setSubjectLine(draft.subjectLine || '');
        setPaletteKey((draft.paletteKey as PaletteKey) || 'classic');
        setPersonalNote(draft.personalNote || '');
        setCustomContent(draft.customContent || '');
        setPhotoUrl(initialPhotoUrl);
        setOverrideNames(draft.overrideNames || '');
        setDraftCampaignId(draft.id);
      } else {
        setSubjectLine('');
        setPaletteKey('classic');
        setPersonalNote('');
        setCustomContent('');
        setPhotoUrl(initialPhotoUrl);
        setOverrideNames('');
        setDraftCampaignId(null);
      }
    } catch (e) {
      console.error('Failed to load campaigns', e);
    }
  };

  useEffect(() => {
    refreshCampaigns();
  }, [weddingId, activeType, wedding?.heroImageKey]);

  // Debounced Auto-save
  useEffect(() => {
    if (!weddingId || !activeType) return;
    
    const timer = setTimeout(async () => {
      try {
        if (draftCampaignId) {
          await client.models.EmailCampaign.update({
            id: draftCampaignId,
            subjectLine,
            paletteKey,
            personalNote,
            customContent,
            photoUrl,
            overrideNames,
          });
        } else {
          const { data } = await client.models.EmailCampaign.create({
            weddingId,
            emailType: activeType,
            status: 'draft',
            subjectLine,
            paletteKey,
            personalNote,
            customContent,
            photoUrl,
            overrideNames,
          });
          if (data) setDraftCampaignId(data.id);
        }
      } catch (e) {
        console.error('Failed to auto-save draft', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [subjectLine, paletteKey, personalNote, customContent, photoUrl, overrideNames, activeType, weddingId, draftCampaignId]);

  return (
    <EmailStudioContext.Provider value={{
      activeType, setActiveType,
      subjectLine, setSubjectLine,
      paletteKey, setPaletteKey,
      personalNote, setPersonalNote,
      customContent, setCustomContent,
      photoUrl, setPhotoUrl,
      overrideNames, setOverrideNames,
      selectedGuestIds, setSelectedGuestIds,
      manualEmails, setManualEmails,
      isSending, setIsSending,
      sendProgress, setSendProgress,
      campaigns, refreshCampaigns,
      draftCampaignId
    }}>
      {children}
    </EmailStudioContext.Provider>
  );
}

export function useEmailStudio() {
  const context = useContext(EmailStudioContext);
  if (!context) throw new Error('useEmailStudio must be used within EmailStudioProvider');
  return context;
}
