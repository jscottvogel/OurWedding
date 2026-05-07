'use client';

import { useEmailStudio, PaletteKey } from './EmailStudioProvider';
import { Check } from 'lucide-react';

const PALETTES: { id: PaletteKey; label: string; colors: string[] }[] = [
  { id: 'classic', label: 'Classic Elegance', colors: ['#2c2420', '#b8975a', '#e8cec9', '#faf7f2'] },
  { id: 'sage', label: 'Garden Sage', colors: ['#3d5040', '#6a8c6e', '#dde8dd', '#f5faf5'] },
  { id: 'navy', label: 'Midnight Navy', colors: ['#1a2740', '#8fa8c8', '#dce8f0', '#f5f8fc'] },
  { id: 'dusty_rose', label: 'Dusty Rose', colors: ['#5a3a3a', '#c8908a', '#f5e0da', '#fdf5f3'] },
];

export default function PalettePicker() {
  const { paletteKey, setPaletteKey } = useEmailStudio();

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-charcoal mb-2">Color Palette</label>
      <div className="grid grid-cols-2 gap-3">
        {PALETTES.map((p) => {
          const isActive = paletteKey === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPaletteKey(p.id)}
              className={`relative flex items-center p-2 rounded border transition-all ${
                isActive ? 'border-sage ring-1 ring-sage' : 'border-light-gray hover:border-sage/50'
              }`}
            >
              <div className="flex w-8 h-8 rounded overflow-hidden mr-3 shrink-0 border border-light-gray">
                {p.colors.map((c, i) => (
                  <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-sm font-medium text-charcoal">{p.label}</span>
              {isActive && <Check className="absolute right-2 text-sage w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
