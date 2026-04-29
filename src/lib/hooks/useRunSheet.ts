'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export interface RunSheetBlock {
  blockIndex: number;
  startTime: string;
  maxDuration: number;
  items: Schema['RunSheetItem']['type'][];
}

export function useRunSheet() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [startItem, setStartItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [endItem, setEndItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [blocks, setBlocks] = useState<RunSheetBlock[]>([]);
  
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
        
        if (!currentStart && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Starts', eventTime: '08:00', itemType: 'START', sortOrder: -1
          });
          if (res.data) currentStart = res.data;
        }
        if (!currentEnd && dbItems.length >= 0) {
          const res = await client.models.RunSheetItem.create({
            weddingId, title: 'Day Ends (Hard Stop)', eventTime: '23:00', itemType: 'END', sortOrder: 9999
          });
          if (res.data) currentEnd = res.data;
        }

        const events = dbItems.filter(i => i.itemType === 'EVENT' || !i.itemType);
        
        // Group by sortOrder
        const blocksMap = new Map<number, typeof events>();
        events.forEach(ev => {
           const order = ev.sortOrder ?? 0;
           if (!blocksMap.has(order)) blocksMap.set(order, []);
           blocksMap.get(order)!.push(ev);
        });

        // Get sorted block indices
        const sortedBlockIndices = Array.from(blocksMap.keys()).sort((a, b) => a - b);
        
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

        let currentTime = currentStart?.eventTime || '08:00';
        const timeUpdates: any[] = [];
        const builtBlocks: RunSheetBlock[] = [];
        
        sortedBlockIndices.forEach((oldOrder, newBlockIndex) => {
           const blockEvents = blocksMap.get(oldOrder)!;
           let maxDurationInBlock = 0;
           
           // Sort events inside the block just alphabetically for stable rendering
           blockEvents.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
           
           const computedItems: typeof events = [];
           
           blockEvents.forEach(event => {
              const computed = { ...event, eventTime: currentTime, sortOrder: newBlockIndex };
              computedItems.push(computed);
              
              if (event.durationMinutes && event.durationMinutes > maxDurationInBlock) {
                 maxDurationInBlock = event.durationMinutes;
              }
              
              if (event.eventTime !== currentTime || event.sortOrder !== newBlockIndex) {
                 timeUpdates.push(client.models.RunSheetItem.update({ 
                   id: event.id, 
                   eventTime: currentTime,
                   sortOrder: newBlockIndex
                 }));
              }
           });
           
           builtBlocks.push({
             blockIndex: newBlockIndex,
             startTime: currentTime,
             maxDuration: maxDurationInBlock,
             items: computedItems
           });
           
           currentTime = addMinutes(currentTime, maxDurationInBlock);
        });
        
        if (timeUpdates.length > 0) Promise.all(timeUpdates).catch(console.error);

        const endTime = currentEnd?.eventTime || '23:00';
        const diff = diffMinutes(currentTime, endTime);
        if (diff > 0) {
          setIsOverSchedule(true);
          setOverScheduleByMins(diff);
        } else {
          setIsOverSchedule(false);
          setOverScheduleByMins(0);
        }

        setStartItem(currentStart || null);
        setEndItem(currentEnd || null);
        setBlocks(builtBlocks);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  // Add item to an existing block
  const addItemToBlock = async (blockIndex: number, item: any) => {
    if (!weddingId) return;
    await client.models.RunSheetItem.create({
      ...item,
      weddingId,
      itemType: 'EVENT',
      sortOrder: blockIndex
    });
  };

  // Insert a completely new block at the target index, pushing everything else down
  const insertNewBlock = async (targetIndex: number, item: any) => {
    if (!weddingId) return;
    
    // Push all blocks >= targetIndex down by 1
    const shiftPromises: any[] = [];
    blocks.forEach(block => {
      if (block.blockIndex >= targetIndex) {
        block.items.forEach(ev => {
          shiftPromises.push(client.models.RunSheetItem.update({ id: ev.id, sortOrder: block.blockIndex + 1 }));
        });
      }
    });
    
    await Promise.all(shiftPromises);
    
    // Create the new item
    await client.models.RunSheetItem.create({
      ...item,
      weddingId,
      itemType: 'EVENT',
      sortOrder: targetIndex
    });
  };

  const updateItem = async (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => {
    await client.models.RunSheetItem.update({ id, ...updates });
  };

  const deleteItem = async (id: string) => {
    await client.models.RunSheetItem.delete({ id });
  };

  return { 
    startItem, 
    endItem, 
    blocks, 
    loading, 
    isOverSchedule, 
    overScheduleByMins, 
    addItemToBlock, 
    insertNewBlock, 
    updateItem, 
    deleteItem 
  };
}
