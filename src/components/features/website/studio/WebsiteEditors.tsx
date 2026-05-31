'use client';

import { useState, useEffect } from 'react';
import { useWebsiteContent } from '@/lib/hooks/useWebsiteContent';
import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useWedding } from '@/lib/hooks/useWedding';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import { Trash2, Plus, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadData } from 'aws-amplify/storage';

const client = generateClient<Schema>();

export function WebsiteEditorPanel({ section }: { section: string }) {
  const { wedding } = useWedding();
  const website = useWebsiteContent();
  const { config, updateConfig } = useWebsiteConfig();

  if (!wedding || !website || !config) return null;

  switch (section) {
    case 'hero':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Hero Section</h3>
          <p className="text-mid-gray mb-6">The hero section displays your names, wedding date, and cover photo. These details are managed in your main dashboard settings.</p>
          <a href="/dashboard" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Go to Dashboard <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'events':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Schedule of Events</h3>
          <p className="text-mid-gray mb-6">Your public schedule is powered directly by your Run Sheet. Only items marked as "Public" will appear on the website.</p>
          <a href="/runsheet" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage Run Sheet <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'story':
      return <OurStoryEditor weddingId={wedding.id} story={website.story} />;
    case 'travel':
      return <TravelEditor weddingId={wedding.id} items={website.travels} />;
    case 'party':
      return <PartyEditor weddingId={wedding.id} config={config} updateConfig={updateConfig} />;
    case 'registry':
      return <RegistryEditor weddingId={wedding.id} items={website.registries} />;
    case 'faq':
      return <FaqEditor weddingId={wedding.id} items={website.faqs} />;
    case 'guestbook':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Guestbook</h3>
          <p className="text-mid-gray">Guestbook moderation and settings are coming soon!</p>
        </div>
      );
    case 'rsvp':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">RSVP Settings</h3>
          <p className="text-mid-gray mb-6">Your RSVP deadlines, meal options, and guest responses are managed in the dedicated RSVP tab.</p>
          <a href="/website/rsvp" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage RSVP <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    case 'gallery':
      return (
        <div className="text-center p-8 bg-ivory rounded-xl border border-light-gray">
          <h3 className="text-xl font-bold text-charcoal mb-4">Photo Gallery</h3>
          <p className="text-mid-gray mb-6">Your public gallery photos are managed in the main Gallery dashboard.</p>
          <a href="/gallery" className="inline-flex items-center text-sage hover:text-dark-sage font-medium">
            Manage Gallery <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      );
    default:
      return (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-light-gray text-mid-gray">
          Select a section to edit its content.
        </div>
      );
  }
}

function OurStoryEditor({ weddingId, story }: { weddingId: string, story: Schema['WebsiteStory']['type'] | null }) {
  const [content, setContent] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (story) {
      setContent(story.coupleStory || '');
      setImageKey(story.storyImageKey || null);
    }
  }, [story]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (story?.id) {
        await client.models.WebsiteStory.update({ id: story.id, coupleStory: content, storyImageKey: imageKey });
      } else {
        await client.models.WebsiteStory.create({ weddingId, coupleStory: content, storyImageKey: imageKey });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save story.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Our Story</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-charcoal mb-2">Story Photo (Optional)</label>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer bg-ivory text-sage px-4 py-2 rounded-md font-medium border border-sage/20 hover:bg-sage/10 transition-colors flex items-center">
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            {isUploading ? 'Uploading...' : (imageKey ? 'Change Photo' : 'Upload Photo')}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              disabled={isUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const key = `story/${Date.now()}-${file.name}`;
                  await uploadData({ path: key, data: file }).result;
                  setImageKey(key);
                } catch (error) {
                  console.error('Upload failed', error);
                  alert('Failed to upload image');
                } finally {
                  setIsUploading(false);
                }
              }}
            />
          </label>
          {imageKey && (
            <button 
              onClick={() => setImageKey(null)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>

      <label className="block text-sm font-medium text-charcoal mb-2">The Story</label>
      <textarea
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Once upon a time..."
        className="w-full border border-light-gray rounded-md focus:ring-sage focus:border-sage p-3 mb-4"
      />
      <button 
        onClick={handleSave} 
        disabled={isSaving || isUploading}
        className="w-full bg-sage text-white py-2 rounded-md font-medium hover:bg-dark-sage disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Story'}
      </button>
    </div>
  );
}

function TravelEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsiteTravel']['type'][] }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await client.models.WebsiteTravel.create({ weddingId, hotelName: name, address, bookingUrl: url, isVisible: true });
    setName(''); setAddress(''); setUrl('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Travel & Accommodations</h3>
      <div className="space-y-3 mb-6">
        {items.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-light-gray">
            <div>
              <p className="font-bold text-sm text-charcoal">{t.hotelName}</p>
              {t.address && <p className="text-xs text-mid-gray">{t.address}</p>}
            </div>
            <button onClick={() => client.models.WebsiteTravel.delete({ id: t.id })} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add Hotel</h4>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hotel Name" className="w-full text-sm border-light-gray rounded" required />
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="w-full text-sm border-light-gray rounded" />
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Booking URL" className="w-full text-sm border-light-gray rounded" />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add Hotel</button>
      </form>
    </div>
  );
}

import { ArrowUp, ArrowDown } from 'lucide-react';
import { SYSTEM_TAGS } from '@/lib/constants/tags';

function PartyEditor({ weddingId, config, updateConfig }: { weddingId: string, config: Schema['WebsiteConfig']['type'], updateConfig: (updates: any) => Promise<void> }) {
  const [availableTags, setAvailableTags] = useState<string[]>(SYSTEM_TAGS);
  const [selectedTags, setSelectedTags] = useState<string[]>(config.partyTags || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch custom tags to merge with SYSTEM_TAGS
    const sub = client.models.GuestTag.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        const itemNames = items.map(t => t.name);
        setAvailableTags(Array.from(new Set([...SYSTEM_TAGS, ...itemNames])));
      }
    });
    return () => sub.unsubscribe();
  }, [weddingId]);

  // Sync with config if it changes
  useEffect(() => {
    setSelectedTags(config.partyTags || []);
  }, [config.partyTags]);

  const toggleTag = (tag: string) => {
    let newTags;
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    saveChanges(newTags);
  };

  const moveTag = (index: number, direction: 'up' | 'down') => {
    const newTags = [...selectedTags];
    if (direction === 'up' && index > 0) {
      [newTags[index - 1], newTags[index]] = [newTags[index], newTags[index - 1]];
    } else if (direction === 'down' && index < newTags.length - 1) {
      [newTags[index + 1], newTags[index]] = [newTags[index], newTags[index + 1]];
    } else {
      return;
    }
    setSelectedTags(newTags);
    saveChanges(newTags);
  };

  const saveChanges = async (tagsToSave: string[]) => {
    setIsSaving(true);
    try {
      await updateConfig({ partyTags: tagsToSave });
    } finally {
      setIsSaving(false);
    }
  };

  const unselectedTags = availableTags.filter(t => !selectedTags.includes(t));

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-2">Wedding Party</h3>
      <p className="text-sm text-mid-gray mb-6">
        Select which guest tags represent your wedding party. The website will automatically group guests by these tags.
      </p>

      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-bold text-charcoal border-b border-light-gray pb-2">Selected Tags (Order displayed on site)</h4>
        {selectedTags.length === 0 ? (
          <p className="text-sm text-mid-gray italic">No tags selected yet.</p>
        ) : (
          <div className="space-y-2">
            {selectedTags.map((tag, idx) => (
              <div key={tag} className="flex justify-between items-center p-3 bg-sage/5 rounded border border-sage/20">
                <span className="font-medium text-sage text-sm">{tag}</span>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => moveTag(idx, 'up')} 
                    disabled={idx === 0}
                    className="p-1 text-mid-gray hover:text-charcoal disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => moveTag(idx, 'down')} 
                    disabled={idx === selectedTags.length - 1}
                    className="p-1 text-mid-gray hover:text-charcoal disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-light-gray mx-2" />
                  <button onClick={() => toggleTag(tag)} className="p-1 text-red-500 hover:text-red-700 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal border-b border-light-gray pb-2">Available Tags to Add</h4>
        <div className="flex flex-wrap gap-2">
          {unselectedTags.map(tag => (
            <button 
              key={tag} 
              onClick={() => toggleTag(tag)}
              className="flex items-center bg-gray-50 hover:bg-sage/10 text-charcoal hover:text-sage border border-light-gray px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" /> {tag}
            </button>
          ))}
          {unselectedTags.length === 0 && (
            <p className="text-xs text-mid-gray">All tags have been added.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RegistryEditor({ weddingId, items }: { weddingId: string, items: Schema['WebsiteRegistry']['type'][] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editImageKey, setEditImageKey] = useState<string | null>(null);
  const [isEditUploading, setIsEditUploading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    await client.models.WebsiteRegistry.create({ weddingId, registryName: name, registryUrl: url, imageKey, isVisible: true });
    setName(''); setUrl(''); setImageKey(null);
  };

  const startEdit = (r: Schema['WebsiteRegistry']['type']) => {
    setEditingId(r.id);
    setEditName(r.registryName || '');
    setEditUrl(r.registryUrl || '');
    setEditImageKey(r.imageKey || null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName || !editUrl) return;
    await client.models.WebsiteRegistry.update({ id: editingId, registryName: editName, registryUrl: editUrl, imageKey: editImageKey });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">Gift Registry</h3>
      <div className="space-y-3 mb-6">
        {items.map(r => (
          <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded border border-light-gray">
            {editingId === r.id ? (
              <div className="flex-1 w-full space-y-2 mr-0 sm:mr-4 mb-3 sm:mb-0">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Store Name" className="w-full text-sm border-light-gray rounded px-3 py-2" />
                <input type="url" value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="URL" className="w-full text-sm border-light-gray rounded px-3 py-2" />
                <div className="flex items-center space-x-2 pt-1">
                  <label className={`cursor-pointer text-xs px-3 py-1.5 rounded font-medium border border-sage/30 hover:bg-sage/5 transition-colors flex items-center ${editImageKey ? 'text-sage' : 'text-mid-gray'}`}>
                    {isEditUploading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <ImageIcon className="w-3 h-3 mr-1.5" />}
                    {isEditUploading ? 'Uploading...' : (editImageKey ? 'Change Image' : 'Add Preview Image')}
                    <input 
                      type="file" className="hidden" accept="image/*" disabled={isEditUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsEditUploading(true);
                        try {
                          const key = `registry/${Date.now()}-${file.name}`;
                          await uploadData({ path: key, data: file }).result;
                          setEditImageKey(key);
                        } catch (error) {
                          console.error('Upload failed', error);
                          alert('Failed to upload image');
                        } finally {
                          setIsEditUploading(false);
                        }
                      }}
                    />
                  </label>
                  {editImageKey && (
                    <button onClick={() => setEditImageKey(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 pr-4 overflow-hidden">
                <p className="font-bold text-sm text-charcoal truncate">{r.registryName}</p>
                <a href={r.registryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{r.registryUrl}</a>
              </div>
            )}
            
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              {editingId === r.id ? (
                <>
                  <button onClick={handleSaveEdit} className="text-xs bg-sage text-white px-3 py-1.5 rounded font-medium hover:bg-dark-sage">Save</button>
                  <button onClick={cancelEdit} className="text-xs text-mid-gray hover:text-charcoal px-3 py-1.5 font-medium">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(r)} className="text-xs text-sage font-medium hover:underline mr-1">Edit</button>
                  <button onClick={() => client.models.WebsiteRegistry.delete({ id: r.id })} className="text-red-500 hover:text-red-700 p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add Registry</h4>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Store Name (e.g. Target, Amazon)" className="w-full text-sm border-light-gray rounded" required />
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Registry Link (URL)" className="w-full text-sm border-light-gray rounded" required />
        <div className="flex items-center space-x-2 pb-2">
          <label className={`cursor-pointer text-sm px-4 py-2 rounded font-medium border border-sage/30 hover:bg-sage/5 transition-colors flex items-center ${imageKey ? 'text-sage' : 'text-mid-gray'}`}>
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            {isUploading ? 'Uploading...' : (imageKey ? 'Change Image' : 'Add Preview Image')}
            <input 
              type="file" className="hidden" accept="image/*" disabled={isUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const key = `registry/${Date.now()}-${file.name}`;
                  await uploadData({ path: key, data: file }).result;
                  setImageKey(key);
                } catch (error) {
                  console.error('Upload failed', error);
                  alert('Failed to upload image');
                } finally {
                  setIsUploading(false);
                }
              }}
            />
          </label>
          {imageKey && (
            <button type="button" onClick={() => setImageKey(null)} className="text-sm text-red-500 hover:underline">Remove</button>
          )}
        </div>
        <button type="submit" disabled={isUploading} className="w-full bg-sage text-white py-2 rounded text-sm font-medium disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1" /> Add Registry</button>
      </form>
    </div>
  );
}

function FaqEditor({ weddingId, items: initialItems }: { weddingId: string, items: Schema['WebsiteFaq']['type'][] }) {
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  // Sync with upstream changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q || !a) return;
    try {
      const res = await client.models.WebsiteFaq.create({ weddingId, question: q, answer: a, category: 'GENERAL', isVisible: true });
      if (res.errors) {
        console.error('Failed to create FAQ:', res.errors);
        alert('Error adding FAQ: ' + res.errors[0].message);
      } else if (res.data) {
        setItems(prev => [...prev, res.data as Schema['WebsiteFaq']['type']]);
        setQ(''); setA('');
      }
    } catch (err: any) {
      console.error('Error in FaqEditor:', err);
      alert('Error adding FAQ: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray">
      <h3 className="text-lg font-bold text-charcoal mb-4">FAQs</h3>
      <div className="space-y-3 mb-6">
        {items.map(f => (
          <div key={f.id} className="flex justify-between items-start p-3 bg-gray-50 rounded border border-light-gray">
            <div className="pr-4">
              <p className="font-bold text-sm text-charcoal mb-1">{f.question}</p>
              <p className="text-xs text-mid-gray">{f.answer}</p>
            </div>
            <button 
              onClick={() => {
                client.models.WebsiteFaq.delete({ id: f.id });
                setItems(prev => prev.filter(item => item.id !== f.id));
              }} 
              className="text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t border-light-gray">
        <h4 className="text-sm font-bold text-charcoal">Add FAQ</h4>
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Question" className="w-full text-sm border-light-gray rounded" required />
        <textarea rows={2} value={a} onChange={e => setA(e.target.value)} placeholder="Answer" className="w-full text-sm border-light-gray rounded" required />
        <button type="submit" className="w-full bg-sage text-white py-2 rounded text-sm font-medium"><Plus className="w-4 h-4 inline mr-1" /> Add FAQ</button>
      </form>
    </div>
  );
}
