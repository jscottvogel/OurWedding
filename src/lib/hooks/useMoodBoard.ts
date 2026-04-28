'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export type MoodBoardItem = Schema['MoodPin']['type'] & {
  url?: string;
};

export function useMoodBoard() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [items, setItems] = useState<MoodBoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.MoodBoardItem.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: async ({ items }) => {
        // Resolve S3 presigned URLs for each item
        const itemsWithUrls = await Promise.all(
          items.map(async (item) => {
            if (item.imageKey) {
              try {
                const urlResult = await getUrl({ path: item.imageKey });
                return { ...item, url: urlResult.url.toString() };
              } catch (e) {
                return { ...item };
              }
            }
            return { ...item };
          })
        );
        
        setItems(itemsWithUrls);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  const addItem = async (item: Omit<Schema['MoodBoardItem']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    await client.models.MoodBoardItem.create({
      ...item,
      weddingId
    });
  };

  const deleteItem = async (item: MoodBoardItem) => {
    try {
      await client.models.MoodBoardItem.delete({ id: item.id });
      
      // If it has an S3 file, delete that too
      if (item.imageKey) {
        await remove({ path: item.imageKey });
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  return { items, loading, addItem, deleteItem };
}
