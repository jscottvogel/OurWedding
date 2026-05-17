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
    const { data } = await client.models.BudgetItem.create({
      ...item,
      weddingId
    });
    if (data) {
      setItems(prev => [...prev, data]);
    }
  };

  const updateItem = async (id: string, updates: Partial<Schema['BudgetItem']['type']>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    const { data } = await client.models.BudgetItem.update({
      id,
      ...updates
    });
    if (data) {
      setItems(prev => prev.map(i => i.id === id ? data : i));
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await client.models.BudgetItem.delete({ id });
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
