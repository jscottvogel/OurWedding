'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useRunSheet() {
  const { weddingId, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Schema['RunSheetItem']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.RunSheetItem.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setItems([...items].sort((a, b) => {
          const sortA = a.sortOrder || 0;
          const sortB = b.sortOrder || 0;
          if (sortA !== sortB) return sortA - sortB;
          
          if (!a.eventTime || !b.eventTime) return 0;
          const timeA = a.eventTime || '00:00';
          const timeB = b.eventTime || '00:00';
          return timeA.localeCompare(timeB);
        }));
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  const addItem = async (item: Omit<Schema['RunSheetItem']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    await client.models.RunSheetItem.create({
      ...item,
      weddingId
    });
  };

  const updateItem = async (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => {
    await client.models.RunSheetItem.update({
      id,
      ...updates
    });
  };

  const deleteItem = async (id: string) => {
    await client.models.RunSheetItem.delete({ id });
  };

  const moveItem = async (currentIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === items.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const updates = items.map((item, idx) => {
      let newOrder = idx;
      if (idx === currentIndex) newOrder = targetIndex;
      else if (idx === targetIndex) newOrder = currentIndex;
      
      return { id: item.id, sortOrder: newOrder, currentOrder: item.sortOrder };
    });

    const promises = updates
      .filter(u => u.sortOrder !== u.currentOrder)
      .map(u => client.models.RunSheetItem.update({ id: u.id, sortOrder: u.sortOrder }));
      
    await Promise.all(promises);
  };

  return { items, loading, addItem, updateItem, deleteItem, moveItem };
}
