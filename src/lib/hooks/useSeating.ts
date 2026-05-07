'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useSeating() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [tables, setTables] = useState<Schema['SeatingTable']['type'][]>([]);
  const [guests, setGuests] = useState<Schema['Guest']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const subTables = client.models.SeatingTable.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setTables(items);
      },
      error: (err) => console.error(err)
    });
    
    const subGuests = client.models.Guest.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setGuests(items);
        setLoading(false);
      },
      error: (err) => console.error(err)
    });

    return () => {
      subTables.unsubscribe();
      subGuests.unsubscribe();
    };
  }, [weddingId, authLoading]);

  const addTable = async (table: Omit<Schema['SeatingTable']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newTable = { 
      ...table, 
      id: tempId, 
      weddingId, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    } as Schema['SeatingTable']['type'];
    setTables(prev => [...prev, newTable]);

    return await client.models.SeatingTable.create({
      ...table,
      weddingId
    });
  };

  const updateTable = async (id: string, updates: Partial<Schema['SeatingTable']['type']>) => {
    // Optimistic UI update
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    return await client.models.SeatingTable.update({
      id,
      ...updates
    });
  };

  const deleteTable = async (id: string) => {
    // Find guests currently at this table
    const orphanedGuests = guests.filter(g => g.tableId === id);

    // Optimistic UI updates
    setTables(prev => prev.filter(t => t.id !== id));
    if (orphanedGuests.length > 0) {
      setGuests(prev => prev.map(g => g.tableId === id ? { ...g, tableId: undefined } : g));
    }

    // Update backend
    const promises: Promise<any>[] = orphanedGuests.map(g => 
      client.models.Guest.update({ id: g.id, tableId: null })
    );
    promises.push(client.models.SeatingTable.delete({ id }));
    
    await Promise.all(promises);
  };
  
  const assignGuestToTable = async (guestId: string, tableId: string | null) => {
    // Optimistic UI update
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, tableId: tableId } : g));

    return await client.models.Guest.update({
      id: guestId,
      tableId: tableId === null ? null : tableId
    });
  };

  return { tables, guests, loading, addTable, updateTable, deleteTable, assignGuestToTable };
}
