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

    // For MVP Testing: we fetch the first available wedding since custom Cognito attributes aren't synced
    const sub = client.models.Wedding.observeQuery().subscribe({
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
  }, [authLoading]);

  return { wedding, loading };
}
