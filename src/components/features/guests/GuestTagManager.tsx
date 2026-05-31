'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { SYSTEM_TAGS } from '@/lib/constants/tags';
import { useAuth } from '@/lib/hooks/useAuth';
import { Tag, Plus, Trash2, X, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

const client = generateClient<Schema>();

export default function GuestTagManager({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { weddingId } = useAuth();
  const [tags, setTags] = useState<Schema['GuestTag']['type'][]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId || !isOpen) return;
    
    const sub = client.models.GuestTag.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        const itemNames = new Set(items.map(t => t.name));
        const virtualTags = SYSTEM_TAGS.filter(name => !itemNames.has(name)).map(name => ({
          id: `system-${name}`,
          name,
          isPublic: false,
          weddingId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Schema['GuestTag']['type']));
        
        const allTags = [...items, ...virtualTags].sort((a, b) => {
          const aIsSystem = SYSTEM_TAGS.includes(a.name);
          const bIsSystem = SYSTEM_TAGS.includes(b.name);
          if (aIsSystem && !bIsSystem) return -1;
          if (!aIsSystem && bIsSystem) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setTags(allTags);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });
    
    return () => sub.unsubscribe();
  }, [weddingId, isOpen]);

  const handleAdd = async () => {
    if (!newTagName.trim() || !weddingId) return;
    try {
      await client.models.GuestTag.create({
        weddingId,
        name: newTagName.trim(),
        isPublic
      });
      setNewTagName('');
      setIsPublic(false);
      toast.success('Tag created');
    } catch (e) {
      toast.error('Failed to create tag');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.models.GuestTag.delete({ id });
      toast.success('Tag deleted');
    } catch (e) {
      toast.error('Failed to delete tag');
    }
  };

  const handleTogglePublic = async (tag: Schema['GuestTag']['type']) => {
    try {
      if (tag.id.startsWith('system-')) {
        await client.models.GuestTag.create({
          weddingId,
          name: tag.name,
          isPublic: !tag.isPublic
        });
      } else {
        await client.models.GuestTag.update({
          id: tag.id,
          isPublic: !tag.isPublic
        });
      }
    } catch (e) {
      toast.error('Failed to update tag');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-light-gray flex-shrink-0">
          <h2 className="text-xl font-display text-sage flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Manage Guest Tags
          </h2>
          <button onClick={onClose} className="text-mid-gray hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <div className="flex space-x-2 mb-6">
            <input 
              type="text" 
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="New tag name..."
              className="flex-1 p-2 border border-light-gray rounded-lg focus:border-sage focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`p-2 border rounded-lg transition-colors flex items-center justify-center ${isPublic ? 'border-sage text-sage bg-sage/10' : 'border-light-gray text-mid-gray'}`}
              title={isPublic ? "Public Tag (guests can see/toggle)" : "Private Tag (host only)"}
            >
              {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleAdd}
              disabled={!newTagName.trim()}
              className="bg-sage text-white p-2 rounded-lg hover:bg-dark-sage disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <p className="text-center text-mid-gray py-4">Loading...</p>
          ) : tags.length === 0 ? (
            <p className="text-center text-mid-gray py-8 px-4 text-sm">No tags created yet. Private tags are for your eyes only. Public tags will appear on the RSVP form for guests to select (e.g., Dietary Restrictions).</p>
          ) : (
            <ul className="space-y-2">
              {tags.map(tag => {
                const isSystemTag = SYSTEM_TAGS.includes(tag.name);
                return (
                  <li key={tag.id} className="flex items-center justify-between p-3 border border-light-gray rounded-lg bg-ivory/30">
                    <div>
                      <span className="font-medium text-charcoal">{tag.name}</span>
                      {isSystemTag && <span className="ml-2 text-[10px] uppercase tracking-wider text-sage bg-sage/10 px-1.5 py-0.5 rounded">System Tag</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleTogglePublic(tag)}
                        className={`text-xs px-2 py-1 rounded flex items-center ${tag.isPublic ? 'bg-sage/10 text-sage' : 'bg-gray-100 text-mid-gray'}`}
                      >
                        {tag.isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                        {tag.isPublic ? 'Public' : 'Private'}
                      </button>
                      {!isSystemTag && (
                        <button 
                          onClick={() => handleDelete(tag.id)}
                          className="text-mid-gray hover:text-red-500 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
