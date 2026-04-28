'use client';

import { useState } from 'react';
import { useMoodBoard } from '@/lib/hooks/useMoodBoard';
import { useWedding } from '@/lib/hooks/useWedding';
import MasonryLayout from '@/components/features/moodboard/MasonryLayout';
import ColorPalette from '@/components/features/moodboard/ColorPalette';

export default function MoodBoardPage() {
  const { items, loading, addItem, deleteItem } = useMoodBoard();
  const { wedding, updateWedding } = useWedding();
  
  // Extract theme colors from wedding config or use defaults
  const themeColors = wedding?.themeColors || ['#6B8F71', '#F4F1EA', '#C1693C'];

  const handleUpdateColors = async (newColors: string[]) => {
    if (wedding) {
      await updateWedding({ themeColors: newColors });
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading mood board...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-sage mb-2">Mood Board</h1>
        <p className="text-mid-gray">Gather inspiration and define the aesthetic for your wedding.</p>
      </div>

      <ColorPalette 
        colors={themeColors} 
        onUpdate={handleUpdateColors} 
      />

      <MasonryLayout 
        items={items} 
        weddingId={wedding?.id || ''}
        onAddItem={addItem} 
        onDeleteItem={deleteItem} 
      />
    </div>
  );
}
