'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export type MoodPinItem = Schema['MoodPin']['type'] & {
  url?: string;
};

export function useMoodBoard() {
  const { weddingId, loading: authLoading } = useAuth();
  
  const [boardId, setBoardId] = useState<string | null>(null);
  const [items, setItems] = useState<MoodPinItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const initBoard = async () => {
      try {
        const { data: boards } = await client.models.MoodBoard.list({
          filter: { weddingId: { eq: weddingId } }
        });
        let currentBoard = boards[0];
        
        if (!currentBoard) {
          const { data: newBoard } = await client.models.MoodBoard.create({
            weddingId,
            title: 'Our Mood Board'
          });
          currentBoard = newBoard as Schema['MoodBoard']['type'];
        }
        
        if (currentBoard) {
          setBoardId(currentBoard.id);
        }
      } catch (err) {
        console.error('Failed to init mood board:', err);
        setLoading(false);
      }
    };
    
    initBoard();
  }, [weddingId, authLoading]);

  useEffect(() => {
    if (!boardId) return;

    const sub = client.models.MoodPin.observeQuery({
      filter: { moodBoardId: { eq: boardId } }
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
  }, [boardId]);

  const addItem = async (item: Omit<Schema['MoodPin']['type'], 'id' | 'createdAt' | 'updatedAt' | 'moodBoardId'>) => {
    if (!boardId) return;
    await client.models.MoodPin.create({
      ...item,
      moodBoardId: boardId
    });
  };

  const deleteItem = async (item: MoodPinItem) => {
    try {
      await client.models.MoodPin.delete({ id: item.id });
      
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
