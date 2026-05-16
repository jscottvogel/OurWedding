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
        setTasks([...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
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
    const { data } = await client.models.ChecklistItem.create({
      ...task,
      weddingId
    });
    if (data) {
      setTasks(prev => [...prev, data].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
  };

  const updateTask = async (id: string, updates: Partial<Schema['ChecklistItem']['type']>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    
    const { data } = await client.models.ChecklistItem.update({
      id,
      ...updates
    });
    
    if (data) {
      setTasks(prev => prev.map(t => t.id === id ? data : t).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await client.models.ChecklistItem.delete({ id });
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}
