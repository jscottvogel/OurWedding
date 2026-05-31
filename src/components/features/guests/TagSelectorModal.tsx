import React, { useState } from 'react';
import { X, Search, Tag, Check } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';

interface TagSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: Schema['GuestTag']['type'][];
  initialSelected: string[];
  legacyTags: string[];
  onSave: (selected: string[], legacy: string[]) => void;
}

export default function TagSelectorModal({ isOpen, onClose, availableTags, initialSelected, legacyTags, onSave }: TagSelectorModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [legacy, setLegacy] = useState<Set<string>>(new Set(legacyTags));
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const toggleTag = (tagName: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(tagName)) {
      newSelected.delete(tagName);
    } else {
      newSelected.add(tagName);
    }
    setSelected(newSelected);
  };

  const removeLegacy = (tagName: string) => {
    const newLegacy = new Set(legacy);
    newLegacy.delete(tagName);
    setLegacy(newLegacy);
  };

  const handleSave = () => {
    onSave(Array.from(selected), Array.from(legacy));
    onClose();
  };

  const filteredTags = availableTags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-5 border-b border-light-gray flex-shrink-0">
          <h2 className="text-lg font-display text-sage flex items-center">
            <Tag className="w-4 h-4 mr-2" /> Select Tags
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-light-gray bg-ivory/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mid-gray" />
            <input 
              type="text" 
              placeholder="Search tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-light-gray rounded-lg text-sm focus:border-sage focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-auto bg-gray-50/50">
          {legacy.size > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-mid-gray uppercase tracking-wider mb-2">Legacy Tags</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(legacy).map(tag => (
                  <span key={tag} className="flex items-center bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                    {tag}
                    <button onClick={() => removeLegacy(tag)} className="ml-1.5 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium text-mid-gray uppercase tracking-wider mb-2">Available Tags</h3>
            <div className="grid gap-2">
              {filteredTags.map(tag => {
                const isSelected = selected.has(tag.name);
                return (
                  <label 
                    key={tag.id} 
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-sage bg-sage/5' : 'border-light-gray bg-white hover:border-sage/30'}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-sage border-sage text-white' : 'border-gray-300'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm ${isSelected ? 'font-medium text-sage' : 'text-charcoal'}`}>{tag.name}</span>
                  </label>
                );
              })}
              {filteredTags.length === 0 && (
                <p className="text-sm text-mid-gray text-center py-4">No tags found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-light-gray flex justify-end bg-white">
          <button 
            onClick={handleSave}
            className="bg-sage text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-dark-sage transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
