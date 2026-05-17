'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export type CalculatedRunSheetItem = Schema['RunSheetItem']['type'] & {
  scheduledStartTime: string;
  scheduledEndTime: string;
};

export function useRunSheetProvider() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [dbItems, setDbItems] = useState<Schema['RunSheetItem']['type'][]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [startItem, setStartItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [endItem, setEndItem] = useState<Schema['RunSheetItem']['type'] | null>(null);
  const [items, setItems] = useState<CalculatedRunSheetItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isOverSchedule, setIsOverSchedule] = useState(false);
  const [overScheduleByMins, setOverScheduleByMins] = useState(0);

  const addMinutes = (timeStr: string, mins: number): string => {
    if (!timeStr) return '00:00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    date.setMinutes(date.getMinutes() + mins);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
  };

  const diffMinutes = (endStr: string, startStr: string): number => {
    if (!endStr || !startStr) return 0;
    const [eH, eM] = endStr.split(':').map(Number);
    const [sH, sM] = startStr.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  };

  const calculateSchedule = (events: any[], currentStart: any, currentEnd: any) => {
    const calculatedItems: CalculatedRunSheetItem[] = [];
    
    let blockStartTime = currentStart?.eventTime || '14:00:00';
    let blockEndTime = blockStartTime;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      let scheduledStartTime;

      if (event.isFixed && event.eventTime) {
        // Fixed time breaks the block logic and forces the start time
        scheduledStartTime = event.eventTime;
        blockStartTime = scheduledStartTime;
        blockEndTime = addMinutes(scheduledStartTime, event.durationMinutes || 0);
      } else {
        scheduledStartTime = blockEndTime;
        blockStartTime = scheduledStartTime;
      }

      const scheduledEndTime = addMinutes(scheduledStartTime, event.durationMinutes || 0);

      if (!event.isFixed) {
        blockEndTime = scheduledEndTime;
      }

      calculatedItems.push({
        ...event,
        scheduledStartTime,
        scheduledEndTime
      });
    }

    // Ensure the list is always strictly chronological
    calculatedItems.sort((a, b) => {
      const timeDiff = a.scheduledStartTime.localeCompare(b.scheduledStartTime);
      if (timeDiff !== 0) return timeDiff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    // Re-assign sortOrder based on chronological sequence
    for (let i = 0; i < calculatedItems.length; i++) {
      calculatedItems[i].sortOrder = i;
    }

    const endTime = currentEnd?.eventTime || '23:00:00';
    const diff = diffMinutes(blockEndTime, endTime);
    
    return { calculatedItems, isOver: diff > 0, overMins: Math.max(0, diff) };
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
      next: async ({ items: incomingDbItems }) => {
        if (hasUnsavedChanges) return; // Prevent overwriting active work

        let currentStart = incomingDbItems.find(i => i.itemType === 'START');
        let currentEnd = incomingDbItems.find(i => i.itemType === 'END');
        
        if (!currentStart) {
          try {
            const res = await client.models.RunSheetItem.create({
              weddingId, title: 'Day Starts', eventTime: '14:00:00', itemType: 'START', sortOrder: -1
            });
            if (res.data) {
              currentStart = res.data;
              incomingDbItems.push(currentStart);
            }
          } catch(e) { console.error(e); }
        }
        if (!currentEnd) {
          try {
            const res = await client.models.RunSheetItem.create({
              weddingId, title: 'Day Ends (Hard Stop)', eventTime: '23:00:00', itemType: 'END', sortOrder: 9999
            });
            if (res.data) {
              currentEnd = res.data;
              incomingDbItems.push(currentEnd);
            }
          } catch(e) { console.error(e); }
        }

        setDbItems(incomingDbItems);

        const events = incomingDbItems.filter(i => i.itemType === 'EVENT' || i.itemType === 'MILESTONE' || !i.itemType);
        events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const { calculatedItems, isOver, overMins } = calculateSchedule(events, currentStart, currentEnd);

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
  }, [weddingId, authLoading, hasUnsavedChanges]);

  useEffect(() => {
    const { isOver, overMins } = calculateSchedule(items, startItem, endItem);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);
  }, [items, startItem, endItem]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      const timeoutId = setTimeout(() => {
        saveChanges();
      }, 1500); // 1.5s debounce
      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, isSaving, items, startItem, endItem]);

  const applyLocalUpdate = (newEvents: CalculatedRunSheetItem[]) => {
    const { calculatedItems } = calculateSchedule(newEvents, startItem, endItem);
    setItems(calculatedItems);
    setHasUnsavedChanges(true);
  };

  const addItem = async (item: Partial<Schema['RunSheetItem']['type']>) => {
    if (!weddingId) return;
    const newItem = {
      ...item,
      id: `temp-${Date.now()}`,
      title: item.title || 'New Event',
      eventTime: item.eventTime ? (item.eventTime.length === 5 ? item.eventTime + ':00' : item.eventTime) : '12:00:00',
      weddingId,
      itemType: item.itemType || 'EVENT',
      isPublic: item.isPublic || false,
      sortOrder: items.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Schema['RunSheetItem']['type'];
    applyLocalUpdate([...items, newItem as CalculatedRunSheetItem]);
    return newItem as CalculatedRunSheetItem;
  };

  const insertNewBlock = async (_targetIndex: number, item: any) => {
    await addItem(item);
  };

  const updateItem = async (id: string, updates: Partial<Schema['RunSheetItem']['type']>) => {
    if (startItem?.id === id) {
      const newStart = { ...startItem, ...updates } as Schema['RunSheetItem']['type'];
      setStartItem(newStart);
      const { calculatedItems } = calculateSchedule(items, newStart, endItem);
      setItems(calculatedItems);
      setHasUnsavedChanges(true);
      return;
    }
    if (endItem?.id === id) {
      const newEnd = { ...endItem, ...updates } as Schema['RunSheetItem']['type'];
      setEndItem(newEnd);
      const { calculatedItems } = calculateSchedule(items, startItem, newEnd);
      setItems(calculatedItems);
      setHasUnsavedChanges(true);
      return;
    }
    applyLocalUpdate(items.map(item => item.id === id ? { ...item, ...updates } as CalculatedRunSheetItem : item));
  };

  const deleteItem = async (id: string) => {
    applyLocalUpdate(items.filter(item => item.id !== id));
  };

  const clearRunsheet = async () => {
    applyLocalUpdate([]);
  };

  const reorderItems = async (newItems: CalculatedRunSheetItem[]) => {
    applyLocalUpdate(newItems);
  };

  const processIvyActions = async (actions: any[]) => {
    if (!weddingId) return;
    let currentItems = [...items];
    
    for (const action of actions) {
      if (action.name === 'clear_runsheet') {
        currentItems = [];
      } else if (action.name === 'add_runsheet_item') {
        const item = action.input;
        const newItem = {
          ...item,
          id: `temp-${Date.now()}-${Math.random()}`,
          title: item.title || 'New Event',
          eventTime: item.eventTime ? (item.eventTime.length === 5 ? item.eventTime + ':00' : item.eventTime) : '12:00:00',
          weddingId,
          itemType: item.itemType || 'EVENT',
          isPublic: item.isPublic || false,
          sortOrder: currentItems.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as CalculatedRunSheetItem;
        currentItems.push(newItem);
      } else if (action.name === 'delete_runsheet_item') {
        currentItems = currentItems.filter(i => i.id !== action.input.id);
      } else if (action.name === 'update_runsheet_item') {
        currentItems = currentItems.map(i => i.id === action.input.id ? { ...i, ...action.input.updates } : i);
      }
    }
    
    applyLocalUpdate(currentItems);
  };

  const saveChanges = async () => {
    if (!weddingId || isSaving) return;
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];

      const dbEvents = dbItems.filter(i => i.itemType === 'EVENT' || i.itemType === 'MILESTONE');
      const localIds = new Set(items.map(i => i.id));
      
      const toDelete = dbEvents.filter(db => !localIds.has(db.id));
      for (const item of toDelete) {
        promises.push(client.models.RunSheetItem.delete({ id: item.id }));
      }

      const allItemsToSave = [...items];
      if (startItem) allItemsToSave.push({ ...startItem, scheduledStartTime: startItem.eventTime } as CalculatedRunSheetItem);
      if (endItem) allItemsToSave.push({ ...endItem, scheduledStartTime: endItem.eventTime } as CalculatedRunSheetItem);

      for (const item of allItemsToSave) {
        const payload = {
          title: item.title,
          description: item.description,
          eventTime: item.scheduledStartTime || item.eventTime, // Use exactly what we calculated
          durationMinutes: item.durationMinutes,
          isFixed: item.isFixed,
          sortOrder: item.sortOrder,
          weddingId: item.weddingId,
          itemType: item.itemType,
          isPublic: item.isPublic || false
        };

        if (item.id.startsWith('temp-')) {
          promises.push(client.models.RunSheetItem.create(payload));
        } else {
          promises.push(client.models.RunSheetItem.update({ id: item.id, ...payload }));
        }
      }

      await Promise.all(promises);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    const events = dbItems.filter(i => i.itemType === 'EVENT' || i.itemType === 'MILESTONE' || !i.itemType);
    events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const { calculatedItems, isOver, overMins } = calculateSchedule(events, startItem, endItem);

    setItems(calculatedItems);
    setIsOverSchedule(isOver);
    setOverScheduleByMins(overMins);
    setHasUnsavedChanges(false);
  };

  return { 
    startItem, 
    endItem, 
    items, 
    loading, 
    isOverSchedule, 
    overScheduleByMins, 
    hasUnsavedChanges,
    isSaving,
    saveChanges,
    discardChanges,
    addItem, 
    insertNewBlock, 
    updateItem, 
    deleteItem,
    clearRunsheet,
    reorderItems,
    processIvyActions,
    blocks: [{ items }]
  };
}

import { createContext, useContext, ReactNode } from 'react';

const RunSheetContext = createContext<ReturnType<typeof useRunSheetProvider> | null>(null);

export function RunSheetProvider({ children }: { children: ReactNode }) {
  const value = useRunSheetProvider();
  return <RunSheetContext.Provider value={value}>{children}</RunSheetContext.Provider>;
}

export function useRunSheet() {
  const context = useContext(RunSheetContext);
  if (!context) {
    throw new Error('useRunSheet must be used within a RunSheetProvider');
  }
  return context;
}
