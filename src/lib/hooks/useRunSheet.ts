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
  const [isOverSchedule, setIsOverSchedule] = useState(false);
  const [overScheduleByMins, setOverScheduleByMins] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.RunSheetItem.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: async ({ items: dbItems }) => {
        let startItem = dbItems.find(i => i.itemType === 'START');
        let endItem = dbItems.find(i => i.itemType === 'END');
        
        // Auto-initialize anchors if they don't exist
        if (!startItem && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Starts', eventTime: '08:00', itemType: 'START', sortOrder: -1
          });
          if (res.data) startItem = res.data;
        }
        if (!endItem && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Ends (Hard Stop)', eventTime: '23:00', itemType: 'END', sortOrder: 9999
          });
          if (res.data) endItem = res.data;
        }

        // Get standard events
        const events = dbItems.filter(i => i.itemType === 'EVENT' || !i.itemType);
        
        // Sort strictly by sortOrder
        events.sort((a, b) => {
          const sortA = a.sortOrder || 0;
          const sortB = b.sortOrder || 0;
          if (sortA !== sortB) return sortA - sortB;
          const timeA = a.eventTime || '00:00';
          const timeB = b.eventTime || '00:00';
          return timeA.localeCompare(timeB);
        });

        // Auto-heal sortOrders sequentially to guarantee robust swapping
        const sortUpdates: any[] = [];
        events.forEach((ev, idx) => {
          if (ev.sortOrder !== idx) {
            ev.sortOrder = idx; // mutate locally for immediate math
            sortUpdates.push(client.models.RunSheetItem.update({ id: ev.id, sortOrder: idx }));
          }
        });
        if (sortUpdates.length > 0) Promise.all(sortUpdates).catch(console.error);

        // Helper to add minutes
        const addMinutes = (timeStr: string, mins: number): string => {
          if (!timeStr) return '00:00';
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date(2000, 0, 1, hours, minutes);
          date.setMinutes(date.getMinutes() + mins);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        };

        // Helper to diff minutes
        const diffMinutes = (endStr: string, startStr: string): number => {
          if (!endStr || !startStr) return 0;
          const [eH, eM] = endStr.split(':').map(Number);
          const [sH, sM] = startStr.split(':').map(Number);
          return (eH * 60 + eM) - (sH * 60 + sM);
        };

        // Cascade compute times
        let currentTime = startItem?.eventTime || '08:00';
        const timeUpdates: any[] = [];
        
        const computedEvents = events.map(event => {
          const computed = { ...event, eventTime: currentTime };
          currentTime = addMinutes(currentTime, event.durationMinutes || 0);
          
          if (event.eventTime !== computed.eventTime) {
             timeUpdates.push(client.models.RunSheetItem.update({ id: event.id, eventTime: computed.eventTime }));
          }
          return computed;
        });
        
        if (timeUpdates.length > 0) Promise.all(timeUpdates).catch(console.error);

        // Calculate overflow
        const endTime = endItem?.eventTime || '23:00';
        const diff = diffMinutes(currentTime, endTime);
        if (diff > 0) {
          setIsOverSchedule(true);
          setOverScheduleByMins(diff);
        } else {
          setIsOverSchedule(false);
          setOverScheduleByMins(0);
        }

        if (startItem && endItem) {
          setItems([startItem as any, ...computedEvents, endItem as any]);
        }
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
    
    // Default to EVENT and place it at the end of the events (which is items.length - 2 because of START and END)
    const targetSortOrder = Math.max(0, items.length - 2);
    
    await client.models.RunSheetItem.create({
      ...item,
      weddingId,
      itemType: item.itemType || 'EVENT',
      sortOrder: targetSortOrder
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
    // Indexes 0 and items.length-1 are START and END. We cannot move them, or move items past them.
    if (currentIndex <= 1 && direction === 'up') return;
    if (currentIndex >= items.length - 2 && direction === 'down') return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap sortOrder of the two events
    const currentItem = items[currentIndex];
    const targetItem = items[targetIndex];

    const tempSort = currentItem.sortOrder;
    const targetSort = targetItem.sortOrder;

    await Promise.all([
      client.models.RunSheetItem.update({ id: currentItem.id, sortOrder: targetSort }),
      client.models.RunSheetItem.update({ id: targetItem.id, sortOrder: tempSort })
    ]);
  };

  return { items, loading, isOverSchedule, overScheduleByMins, addItem, updateItem, deleteItem, moveItem };
}
