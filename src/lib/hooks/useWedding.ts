'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useWedding() {
  const { weddingId, loading: authLoading } = useAuth();
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.Wedding.observeQuery({
      filter: { id: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setWedding(items[0] || null);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  return { wedding, loading };
}
