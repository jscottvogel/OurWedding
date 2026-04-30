'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  const isReordering = useRef(false);

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

  const calculateSchedule = (events: any[], currentStart: any, currentEnd: any) => {
    const calculatedItems: CalculatedRunSheetItem[] = [];
    let currentWallClock = currentStart?.eventTime || '14:00';
    const timeUpdates: any[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const mode = (event.mode as RunSheetItemMode) || 'sequential';
      
      let scheduledStartTime = currentWallClock;
      let scheduledEndTime = currentWallClock;

      if (mode === 'concurrent' && i > 0) {
        scheduledStartTime = calculatedItems[i - 1].scheduledStartTime;
      }

      scheduledEndTime = addMinutes(scheduledStartTime, event.durationMinutes || 0);

      calculatedItems.push({
        ...event,
        mode,
        scheduledStartTime,
        scheduledEndTime
      });

      const isNextConcurrent = i < events.length - 1 && events[i + 1].mode === 'concurrent';
      
      if (!isNextConcurrent) {
        let groupStartIndex = i;
        while (groupStartIndex > 0 && calculatedItems[groupStartIndex].mode === 'concurrent') {
          groupStartIndex--;
        }
        let maxDuration = 0;
        for (let j = groupStartIndex; j <= i; j++) {
          maxDuration = Math.max(maxDuration, calculatedItems[j].durationMinutes || 0);
        }
        currentWallClock = addMinutes(calculatedItems[groupStartIndex].scheduledStartTime, maxDuration);
      }

      if (event.eventTime !== scheduledStartTime || event.sortOrder !== i) {
        timeUpdates.push({
          id: event.id,
          eventTime: scheduledStartTime,
          sortOrder: i
        });
      }
    }

    const endTime = currentEnd?.eventTime || '23:00';
    const diff = diffMinutes(currentWallClock, endTime);
    
    return { calculatedItems, timeUpdates, isOver: diff > 0, overMins: Math.max(0, diff) };
  };

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
        if (isReordering.current) return; // Prevent snap-back during drag-and-drop
        
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

        const { calculatedItems, timeUpdates, isOver, overMins } = calculateSchedule(events, currentStart, currentEnd);

        if (timeUpdates.length > 0) {
          const promises = timeUpdates.map((u: any) => client.models.RunSheetItem.update(u));
          Promise.all(promises).catch(console.error);
        }

        setIsOverSchedule(isOver);
        setOverScheduleByMins(overMins);
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
    // Optimistic update
    isReordering.current = true;
    const newEvents = items.map(item => item.id === id ? { ...item, ...updates } as CalculatedRunSheetItem : item);
    const { calculatedItems, timeUpdates, isOver, overMins } = calculateSchedule(newEvents, startItem, endItem);
    setItems(calculatedItems);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);
    
    await client.models.RunSheetItem.update({ id, ...updates });
    if (timeUpdates.length > 0) {
      await Promise.all(timeUpdates.map((u: any) => client.models.RunSheetItem.update(u)));
    }
    isReordering.current = false;
  };

  const deleteItem = async (id: string) => {
    isReordering.current = true;
    const newEvents = items.filter(item => item.id !== id);
    const { calculatedItems, timeUpdates, isOver, overMins } = calculateSchedule(newEvents, startItem, endItem);
    setItems(calculatedItems);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);

    await client.models.RunSheetItem.delete({ id });
    if (timeUpdates.length > 0) {
      await Promise.all(timeUpdates.map((u: any) => client.models.RunSheetItem.update(u)));
    }
    isReordering.current = false;
  };

  const clearRunsheet = async () => {
    isReordering.current = true;
    const eventsToDelete = items; // all items returned by the hook are EVENTs
    const { calculatedItems, isOver, overMins } = calculateSchedule([], startItem, endItem);
    setItems(calculatedItems);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);

    const deletePromises = eventsToDelete.map(item => client.models.RunSheetItem.delete({ id: item.id }));
    await Promise.all(deletePromises);
    isReordering.current = false;
  };

  const reorderItems = async (newItems: CalculatedRunSheetItem[]) => {
    isReordering.current = true;
    
    // Calculate new times immediately for perfect UI snap
    const { calculatedItems, timeUpdates, isOver, overMins } = calculateSchedule(newItems, startItem, endItem);
    setItems(calculatedItems);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);

    if (timeUpdates.length > 0) {
      await Promise.all(timeUpdates.map((u: any) => client.models.RunSheetItem.update(u)));
    }

    isReordering.current = false;
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
    clearRunsheet,
    reorderItems,
    // Add blocks alias for Ivy backward compatibility if needed, though we will update IvyChat to use insertNewBlock alias.
    // Wait, IvyChat uses `blocks.length` and `blocks.flatMap()`.
    blocks: [{ items }] // Hacky alias to keep `runsheet = blocks.flatMap(b => b.items)` working in IvyChat
  };
}
