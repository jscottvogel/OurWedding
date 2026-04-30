'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export type RunSheetItemMode = 'sequential' | 'concurrent';

export type CalculatedRunSheetItem = Schema['RunSheetItem']['type'] & {
  mode: RunSheetItemMode;
  scheduledStartTime: string;
  scheduledEndTime: string;
};

export function useRunSheet() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [startItem, setStartItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [endItem, setEndItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [items, setItems] = useState<CalculatedRunSheetItem[]>([]);
  
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
        let currentStart = dbItems.find(i => i.itemType === 'START');
        let currentEnd = dbItems.find(i => i.itemType === 'END');
        
        if (!currentStart) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Starts', eventTime: '14:00', itemType: 'START', sortOrder: -1
          });
          if (res.data) currentStart = res.data;
        }
        if (!currentEnd) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Ends (Hard Stop)', eventTime: '23:00', itemType: 'END', sortOrder: 9999
          });
          if (res.data) currentEnd = res.data;
        }

        const events = dbItems.filter(i => i.itemType === 'EVENT' || !i.itemType);
        events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

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

        // Time Calculation Logic
        const calculatedItems: CalculatedRunSheetItem[] = [];
        let currentWallClock = currentStart?.eventTime || '14:00';
        const timeUpdates: any[] = [];
        
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          const mode = (event.mode as RunSheetItemMode) || 'sequential';
          
          let scheduledStartTime = currentWallClock;
          let scheduledEndTime = currentWallClock;

          if (mode === 'concurrent' && i > 0) {
            // Start at the same time as the item directly above it
            scheduledStartTime = calculatedItems[i - 1].scheduledStartTime;
          }

          scheduledEndTime = addMinutes(scheduledStartTime, event.durationMinutes || 0);

          calculatedItems.push({
            ...event,
            mode,
            scheduledStartTime,
            scheduledEndTime
          });

          // If mode is sequential, or we're at the end of a concurrent group,
          // we need to advance the currentWallClock.
          // Wait, the rule is: "When one or more concurrent items run alongside a sequential item, 
          // the block's total duration = max(durations of all items in the concurrent group)."
          
          // Let's look ahead to see if the NEXT item is concurrent.
          // If the next item is NOT concurrent, we advance currentWallClock by the MAX duration of the CURRENT group.
          const isNextConcurrent = i < events.length - 1 && events[i + 1].mode === 'concurrent';
          
          if (!isNextConcurrent) {
            // Find the start of the current concurrent group
            let groupStartIndex = i;
            while (groupStartIndex > 0 && calculatedItems[groupStartIndex].mode === 'concurrent') {
              groupStartIndex--;
            }
            // Max duration of items from groupStartIndex to i
            let maxDuration = 0;
            for (let j = groupStartIndex; j <= i; j++) {
              maxDuration = Math.max(maxDuration, calculatedItems[j].durationMinutes || 0);
            }
            // The wall clock for the next sequential item advances from the group's START time + maxDuration
            currentWallClock = addMinutes(calculatedItems[groupStartIndex].scheduledStartTime, maxDuration);
          }

          if (event.eventTime !== scheduledStartTime || event.sortOrder !== i) {
            timeUpdates.push(client.models.RunSheetItem.update({
              id: event.id,
              eventTime: scheduledStartTime,
              sortOrder: i
            }));
          }
        }

        if (timeUpdates.length > 0) Promise.all(timeUpdates).catch(console.error);

        const endTime = currentEnd?.eventTime || '23:00';
        const diff = diffMinutes(currentWallClock, endTime);
        if (diff > 0) {
          setIsOverSchedule(true);
          setOverScheduleByMins(diff);
        } else {
          setIsOverSchedule(false);
          setOverScheduleByMins(0);
        }

        setStartItem(currentStart || null);
        setEndItem(currentEnd || null);
        setItems(calculatedItems);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  // Expose addItem
  const addItem = async (item: Partial<Schema['RunSheetItem']['type']>) => {
    if (!weddingId) return;
    await client.models.RunSheetItem.create({
      ...item,
      weddingId,
      itemType: 'EVENT',
      sortOrder: items.length
    });
  };

  // Alias for Ivy
  const insertNewBlock = async (_targetIndex: number, item: any) => {
    await addItem(item);
  };

  const updateItem = async (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => {
    await client.models.RunSheetItem.update({ id, ...updates });
  };

  const deleteItem = async (id: string) => {
    await client.models.RunSheetItem.delete({ id });
  };

  const reorderItems = async (newItems: CalculatedRunSheetItem[]) => {
    const shiftPromises = newItems.map((item, index) => {
      return client.models.RunSheetItem.update({ id: item.id, sortOrder: index });
    });
    await Promise.all(shiftPromises);
  };

  return { 
    startItem, 
    endItem, 
    items, 
    loading, 
    isOverSchedule, 
    overScheduleByMins, 
    addItem, 
    insertNewBlock, 
    updateItem, 
    deleteItem,
    reorderItems,
    // Add blocks alias for Ivy backward compatibility if needed, though we will update IvyChat to use insertNewBlock alias.
    // Wait, IvyChat uses `blocks.length` and `blocks.flatMap()`.
    blocks: [{ items }] // Hacky alias to keep `runsheet = blocks.flatMap(b => b.items)` working in IvyChat
  };
}
