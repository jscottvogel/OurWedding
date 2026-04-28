'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useSeating() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [tables, setTables] = useState<Schema['Table']['type'][]>([]);
  const [guests, setGuests] = useState<Schema['Guest']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const subTables = client.models.Table.observeQuery({
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

  const addTable = async (table: Omit<Schema['Table']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    return await client.models.Table.create({
      ...table,
      weddingId
    });
  };

  const updateTable = async (id: string, updates: Partial<Schema['Table']['type']>) => {
    return await client.models.Table.update({
      id,
      ...updates
    });
  };

  const deleteTable = async (id: string) => {
    await client.models.Table.delete({ id });
  };
  
  const assignGuestToTable = async (guestId: string, tableId: string | null) => {
    return await client.models.Guest.update({
      id: guestId,
      tableId: tableId === null ? undefined : tableId
    });
  };

  return { tables, guests, loading, addTable, updateTable, deleteTable, assignGuestToTable };
}
