'use client';

import { useState, useRef } from 'react';
import { MoodPinItem } from '@/lib/hooks/useMoodBoard';
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { uploadFile } from '@/lib/storage/files';
import { toast } from 'sonner';
import { importImageFromUrl } from '@/lib/actions/moodboard';

const safeHref = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : undefined);

interface MasonryLayoutProps {
  items: MoodPinItem[];
  weddingId: string;
  onAddItem: (item: any) => Promise<void>;
  onDeleteItem: (item: MoodPinItem) => Promise<void>;
}

export default function MasonryLayout({ items, weddingId, onAddItem, onDeleteItem }: MasonryLayoutProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<MoodPinItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !weddingId) return;

    setIsUploading(true);
    try {
      const fileKey = await uploadFile({ weddingId, kind: 'moodboard', file });
      
      await onAddItem({
        imageKey: fileKey,
        notes: 'Uploaded inspiration'
      });
      
      toast.success('Image added to mood board');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url || !weddingId) return;
    setIsUploading(true);
    try {
      const res = await importImageFromUrl(url);
      if (!res.ok || !res.imageBase64 || !res.contentType) {
        toast.error(res.error || 'Could not import image from that link');
        return;
      }
      const bytes = Uint8Array.from(atob(res.imageBase64), c => c.charCodeAt(0));
      const ext = res.contentType.split('/')[1] || 'jpg';
      const fileKey = await uploadFile({
        weddingId,
        kind: 'moodboard',
        file: new Blob([bytes], { type: res.contentType }),
        fileName: `import.${ext}`,
        contentType: res.contentType,
      });
      await onAddItem({
        imageKey: fileKey,
        sourceUrl: url,
        title: res.title,
        notes: res.title || url
      });
      setLinkUrl('');
      setIsAddingLink(false);
      toast.success('Image added to mood board');
    } catch (error) {
      console.error('URL import error:', error);
      toast.error('Failed to import image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin text-sage" /> : <ImageIcon className="w-5 h-5 mr-2 text-sage" />}
          Upload Image
        </button>
        <input 
          type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*"
        />
        
        <div className="relative flex-1 max-w-md">
          {isAddingLink ? (
            <div className="flex bg-white rounded-lg border border-sage shadow-sm overflow-hidden">
              <input 
                type="url" 
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Paste Pinterest or image URL..."
                className="flex-1 p-2 text-sm focus:outline-none"
                autoFocus
              />
              <button onClick={handleAddLink} disabled={isUploading} className="bg-sage text-white px-3 text-sm font-medium hover:bg-dark-sage disabled:opacity-50">{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}</button>
              <button onClick={() => setIsAddingLink(false)} className="bg-light-gray text-mid-gray px-3 hover:text-charcoal"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingLink(true)}
              className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm w-full"
            >
              <LinkIcon className="w-5 h-5 mr-2 text-sage" />
              Add from URL (Pinterest, etc.)
            </button>
          )}
        </div>
      </div>

      {/* Masonry Grid (CSS based columns) */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {items.map((item) => (
          <div key={item.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-white shadow-sm border border-light-gray">
            {item.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={item.url} 
                alt={item.notes || 'Mood board inspiration'} 
                className="w-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(item)}
                loading="lazy"
              />
            ) : (
              <div className="p-6 bg-ivory text-center break-all">
                <LinkIcon className="w-8 h-8 text-sage mx-auto mb-2" />
                <a href={safeHref(item.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-sage hover:underline">
                  {item.notes || item.sourceUrl}
                </a>
              </div>
            )}
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onDeleteItem(item)}
                className="p-1.5 bg-white/90 text-red-500 rounded-full hover:bg-red-50 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {item.url && item.notes && item.notes !== 'Uploaded inspiration' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/80 to-transparent p-4 pt-8">
                <p className="text-white text-sm">{item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && !isUploading && (
        <div className="py-20 text-center border-2 border-dashed border-light-gray rounded-xl bg-ivory/30">
          <ImageIcon className="w-12 h-12 text-sage mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display text-charcoal mb-2">Build your vision</h3>
          <p className="text-mid-gray">Upload images or paste links to start creating your mood board.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && selectedImage.url && (
        <div className="fixed inset-0 bg-charcoal/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={selectedImage.url} 
            alt="Enlarged inspiration" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
