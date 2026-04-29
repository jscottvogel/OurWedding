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

        const events = dbItems.filter(i => i.itemType === 'EVENT' || !i.itemType);
        
        events.sort((a, b) => {
          const sortA = a.sortOrder || 0;
          const sortB = b.sortOrder || 0;
          if (sortA !== sortB) return sortA - sortB;
          const timeA = a.eventTime || '00:00';
          const timeB = b.eventTime || '00:00';
          return timeA.localeCompare(timeB);
        });

        const sortUpdates: any[] = [];
        events.forEach((ev, idx) => {
          if (ev.sortOrder !== idx) {
            ev.sortOrder = idx; // mutate locally for immediate math
            sortUpdates.push(client.models.RunSheetItem.update({ id: ev.id, sortOrder: idx }));
          }
        });
        if (sortUpdates.length > 0) Promise.all(sortUpdates).catch(console.error);

        const addMinutes = (timeStr: string, mins: number): string => {
          if (!timeStr) return '00:00';
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date(2000, 0, 1, hours, minutes);
          date.setMinutes(date.getMinutes() + mins);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        };

        const diffMinutes = (endStr: string, startStr: string): number => {
          if (!endStr || !startStr) return 0;
          const [eH, eM] = endStr.split(':').map(Number);
          const [sH, sM] = startStr.split(':').map(Number);
          return (eH * 60 + eM) - (sH * 60 + sM);
        };

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

  const moveItem = async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;
    if (sourceIndex <= 0 || sourceIndex >= items.length - 1) return;
    if (targetIndex <= 0 || targetIndex >= items.length - 1) return;

    const events = items.slice(1, items.length - 1);
    const eventSourceIndex = sourceIndex - 1;
    const eventTargetIndex = targetIndex - 1;

    // Remove from source
    const [movedItem] = events.splice(eventSourceIndex, 1);
    // Insert at target
    events.splice(eventTargetIndex, 0, movedItem);

    // Update all sortOrders sequentially
    const promises = events.map((ev, idx) => {
       return client.models.RunSheetItem.update({ id: ev.id, sortOrder: idx });
    });

    await Promise.all(promises);
  };

  return { items, loading, isOverSchedule, overScheduleByMins, addItem, updateItem, deleteItem, moveItem };
}
