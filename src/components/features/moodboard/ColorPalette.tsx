'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ColorPaletteProps {
  colors?: string[];
  onUpdate: (colors: string[]) => void;
}

export default function ColorPalette({ colors = [], onUpdate }: ColorPaletteProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newColor, setNewColor] = useState('#000000');

  const handleAdd = () => {
    if (!colors.includes(newColor)) {
      onUpdate([...colors, newColor]);
    }
    setIsAdding(false);
  };

  const handleRemove = (colorToRemove: string) => {
    onUpdate(colors.filter(c => c !== colorToRemove));
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color} to clipboard`);
  };

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-lg text-sage">Wedding Palette</h3>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-sm font-medium text-sage hover:text-dark-sage flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Color
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {colors.map((color) => (
          <div key={color} className="group relative">
            <button 
              onClick={() => copyToClipboard(color)}
              className="w-16 h-16 rounded-full shadow-sm border border-light-gray/20 transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
              title={`Click to copy ${color}`}
            />
            <button 
              onClick={() => handleRemove(color)}
              className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-mid-gray hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-center mt-2 text-mid-gray font-mono">{color}</p>
          </div>
        ))}

        {colors.length === 0 && !isAdding && (
          <p className="text-sm text-mid-gray italic">No colors added yet.</p>
        )}

        {isAdding && (
          <div className="flex items-center space-x-2 bg-ivory p-2 rounded-lg border border-light-gray">
            <input 
              type="color" 
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <input 
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-20 text-sm p-1 border border-light-gray rounded font-mono uppercase focus:outline-none focus:border-sage"
            />
            <div className="flex flex-col space-y-1">
              <button onClick={handleAdd} className="text-xs bg-sage text-white px-2 py-0.5 rounded">Add</button>
              <button onClick={() => setIsAdding(false)} className="text-xs bg-light-gray text-charcoal px-2 py-0.5 rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
