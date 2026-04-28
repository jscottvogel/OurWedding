'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useGuests(publicWeddingId?: string) {
  const { weddingId: authWeddingId, loading: authLoading } = useAuth();
  const weddingId = publicWeddingId || authWeddingId;
  
  const [guests, setGuests] = useState<Schema['Guest']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicWeddingId && authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.Guest.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setGuests(items.sort((a, b) => a.firstName.localeCompare(b.firstName)));
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading, publicWeddingId]);

  const addGuest = async (guest: Omit<Schema['Guest']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    return await client.models.Guest.create({
      ...guest,
      weddingId
    });
  };

  const updateGuest = async (id: string, updates: Partial<Schema['Guest']['type']>) => {
    return await client.models.Guest.update({
      id,
      ...updates
    });
  };

  const deleteGuest = async (id: string) => {
    await client.models.Guest.delete({ id });
  };

  return { guests, loading, addGuest, updateGuest, deleteGuest, weddingId };
}
