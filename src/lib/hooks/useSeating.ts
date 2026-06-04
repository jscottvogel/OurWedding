'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';
import { useGuests } from './useGuests';

const client = generateClient<Schema>();

export function useSeating() {
  const { weddingId, loading: authLoading } = useAuth();
  const { guests: queryGuests, loading: guestsLoading } = useGuests();
  
  const [tables, setTables] = useState<Schema['SeatingTable']['type'][]>([]);
  const [guests, setGuests] = useState<Schema['Guest']['type'][]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  useEffect(() => {
    setGuests(queryGuests);
  }, [queryGuests]);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setTablesLoading(false);
      return;
    }

    const subTables = client.models.SeatingTable.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setTables(items);
        setTablesLoading(false);
      },
      error: (err) => {
        console.error(err);
        setTablesLoading(false);
      }
    });

    return () => {
      subTables.unsubscribe();
    };
  }, [weddingId, authLoading]);

  const loading = authLoading || tablesLoading || guestsLoading;



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
  
  const assignPartyToTable = async (partyId: string, tableId: string | null) => {
    // Find all guests in this party
    const partyGuests = guests.filter(g => g.id === partyId || g.primaryGuestId === partyId);
    // Filter only those who are CONFIRMED
    const activePartyGuests = partyGuests.filter(g => g.rsvpStatus === 'CONFIRMED');
    
    const activeIds = new Set(activePartyGuests.map(g => g.id));
    
    // Optimistic UI update
    setGuests(prev => prev.map(g => activeIds.has(g.id) ? { ...g, tableId: tableId === null ? undefined : tableId } : g));

    const promises = activePartyGuests.map(g => 
      client.models.Guest.update({
        id: g.id,
        tableId: tableId === null ? null : tableId
      })
    );
    await Promise.all(promises);
  };

  return { tables, guests, loading, addTable, updateTable, deleteTable, assignPartyToTable };
}
