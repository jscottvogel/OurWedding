'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useBudget() {
  const { weddingId, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Schema['BudgetItem']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.BudgetItem.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setItems(items);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  const addItem = async (item: Omit<Schema['BudgetItem']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    await client.models.BudgetItem.create({
      ...item,
      weddingId
    });
  };

  const updateItem = async (id: string, updates: Partial<Schema['BudgetItem']['type']>) => {
    await client.models.BudgetItem.update({
      id,
      ...updates
    });
  };

  const deleteItem = async (id: string) => {
    await client.models.BudgetItem.delete({ id });
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
