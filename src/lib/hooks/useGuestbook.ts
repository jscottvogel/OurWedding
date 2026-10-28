'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';
import { getWeddingOwners } from '../amplify/weddingOwners';

const client = generateClient<Schema>();

export type GuestbookEntry = Schema['WebsiteGuestbook']['type'];

export function useGuestbook(publicWeddingId?: string) {
  const { weddingId: authWeddingId, loading: authLoading } = useAuth();
  const weddingId = publicWeddingId || authWeddingId;
  
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicWeddingId && authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.WebsiteGuestbook.observeQuery({
      filter: { weddingId: { eq: weddingId } },
      ...(publicWeddingId ? { authMode: 'apiKey' as const } : {})
    }).subscribe({
      next: ({ items }) => {
        // Filter out soft-deleted items; public visitors only see approved entries
        const activeItems = items.filter(item =>
          !item.isDeleted && (!publicWeddingId || item.isApproved === true)
        );
        
        // Sort by newest first
        activeItems.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setEntries(activeItems);
        setLoading(false);
      },
      error: (err) => {
        console.error('Error fetching guestbook entries:', err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading, publicWeddingId]);

  const addEntry = async (record: Omit<GuestbookEntry, 'id' | 'createdAt' | 'updatedAt' | 'weddingId' | 'isDeleted'>) => {
    if (!weddingId) throw new Error('No wedding ID available');
    
    if (publicWeddingId) {
      // Public visitors write through the validated Lambda mutation (always isApproved=false).
      const { errors } = await client.mutations.submitGuestbookEntry({
        weddingId,
        guestName: record.guestName,
        message: record.message ?? undefined,
        songRequest: record.songRequest ?? undefined,
        messageType: record.messageType ?? undefined,
        mediaKey: record.mediaKey ?? undefined,
        mediaType: record.mediaType ?? undefined,
      }, { authMode: 'apiKey' });
      if (errors?.length) throw new Error(errors[0].message);
      return;
    }
    await client.models.WebsiteGuestbook.create({
      ...record,
      weddingId,
      owners: await getWeddingOwners(weddingId)
    });
  };

  const deleteEntry = async (id: string) => {
    try {
      // Soft delete
      await client.models.WebsiteGuestbook.update({
        id,
        isDeleted: true
      });
    } catch (err) {
      console.error('Failed to delete guestbook entry', err);
      throw err;
    }
  };

  const toggleApproval = async (id: string, isApproved: boolean) => {
    try {
      await client.models.WebsiteGuestbook.update({
        id,
        isApproved
      });
    } catch (err) {
      console.error('Failed to toggle approval', err);
      throw err;
    }
  };

  return { 
    entries, 
    loading, 
    addEntry, 
    deleteEntry, 
    toggleApproval, 
    weddingId 
  };
}
