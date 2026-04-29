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
    
    // Create a mutable copy of items to simulate the swap
    const newItems = [...items].map(item => ({ ...item }));
    
    // Swap the elements
    const temp = newItems[currentIndex];
    newItems[currentIndex] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Helper to add minutes to an HH:mm string
    const addMinutes = (timeStr: string, mins: number): string => {
      if (!timeStr) return '00:00';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(2000, 0, 1, hours, minutes);
      date.setMinutes(date.getMinutes() + mins);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // Recalculate eventTimes top-down
    let currentTime = newItems[0].eventTime || '00:00';
    
    const updates: { id: string, eventTime: string }[] = [];

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      // Keep track of what we changed
      if (item.eventTime !== currentTime) {
        updates.push({ id: item.id, eventTime: currentTime });
      }
      
      // Update local copy so the cascade continues correctly
      item.eventTime = currentTime;
      
      // Advance the time for the NEXT item
      currentTime = addMinutes(currentTime, item.durationMinutes || 0);
    }

    // Push all updates to database
    const promises = updates.map(u => client.models.RunSheetItem.update({ id: u.id, eventTime: u.eventTime }));
    await Promise.all(promises);
  };

  return { items, loading, addItem, updateItem, deleteItem, moveItem };
}
