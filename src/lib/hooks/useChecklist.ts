'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useChecklist() {
  const { weddingId, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Schema['ChecklistItem']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.ChecklistItem.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setTasks(items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  const addTask = async (task: Omit<Schema['ChecklistItem']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    await client.models.ChecklistItem.create({
      ...task,
      weddingId
    });
  };

  const updateTask = async (id: string, updates: Partial<Schema['ChecklistItem']['type']>) => {
    await client.models.ChecklistItem.update({
      id,
      ...updates
    });
  };

  const deleteTask = async (id: string) => {
    await client.models.ChecklistItem.delete({ id });
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}
