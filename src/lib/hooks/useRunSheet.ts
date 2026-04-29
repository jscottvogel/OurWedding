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
        
        // Auto-initialize anchors
        if (!startItem && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Starts', eventTime: '08:00', itemType: 'START'
          });
          if (res.data) startItem = res.data;
        }
        if (!endItem && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Ends (Hard Stop)', eventTime: '23:00', itemType: 'END'
          });
          if (res.data) endItem = res.data;
        }

        const events = dbItems.filter(i => i.itemType === 'EVENT' || !i.itemType);
        
        // Helper to add minutes
        const addMinutes = (timeStr: string, mins: number): string => {
          if (!timeStr) return '00:00';
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date(2000, 0, 1, hours, minutes);
          date.setMinutes(date.getMinutes() + mins);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        };

        // Graph calculation
        const itemMap = new Map<string, any>();
        if (startItem) itemMap.set(startItem.id, startItem);
        events.forEach(ev => itemMap.set(ev.id, ev));

        const computedEvents: any[] = [];
        
        const resolveTime = (eventId: string, visited: Set<string>): string => {
          if (visited.has(eventId)) {
             return startItem?.eventTime || '08:00'; // Cycle detected
          }
          visited.add(eventId);

          const event = itemMap.get(eventId);
          if (!event) return startItem?.eventTime || '08:00';
          
          if (event.itemType === 'START') {
             return event.eventTime || '08:00';
          }

          const parentId = event.dependsOnId || startItem?.id;
          if (!parentId) return startItem?.eventTime || '08:00';

          const parentStartTime = resolveTime(parentId, visited);
          const parentEvent = itemMap.get(parentId);
          const parentDuration = parentEvent?.durationMinutes || 0;
          
          return addMinutes(parentStartTime, parentDuration);
        };

        const timeUpdates: any[] = [];

        events.forEach(event => {
           const computedTime = resolveTime(event.id, new Set<string>());
           const computed = { ...event, eventTime: computedTime };
           computedEvents.push(computed);

           if (event.eventTime !== computedTime) {
             timeUpdates.push(client.models.RunSheetItem.update({ id: event.id, eventTime: computedTime }));
           }
        });

        if (timeUpdates.length > 0) Promise.all(timeUpdates).catch(console.error);

        // Sort events chronologically
        computedEvents.sort((a, b) => {
          const tA = a.eventTime || '00:00';
          const tB = b.eventTime || '00:00';
          if (tA !== tB) return tA.localeCompare(tB);
          return (a.title || '').localeCompare(b.title || '');
        });

        let maxEndTime = startItem?.eventTime || '08:00';
        computedEvents.forEach(ev => {
           const endTime = addMinutes(ev.eventTime, ev.durationMinutes || 0);
           if (endTime > maxEndTime) maxEndTime = endTime;
        });

        const diffMinutes = (endStr: string, startStr: string): number => {
          if (!endStr || !startStr) return 0;
          const [eH, eM] = endStr.split(':').map(Number);
          const [sH, sM] = startStr.split(':').map(Number);
          return (eH * 60 + eM) - (sH * 60 + sM);
        };

        const hardStopTime = endItem?.eventTime || '23:00';
        const diff = diffMinutes(maxEndTime, hardStopTime);
        
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
    
    let targetParentId = item.dependsOnId;
    if (!targetParentId && items.length > 0) {
       const prevEvent = items[items.length - 2];
       if (prevEvent && prevEvent.itemType !== 'END') {
          targetParentId = prevEvent.id;
       }
    }

    await client.models.RunSheetItem.create({
      ...item,
      weddingId,
      itemType: item.itemType || 'EVENT',
      dependsOnId: targetParentId
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

  return { items, loading, isOverSchedule, overScheduleByMins, addItem, updateItem, deleteItem };
}
