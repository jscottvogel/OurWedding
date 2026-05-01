'use client';

import { useState } from 'react';
import { GalleryPhoto } from '@/lib/hooks/useGallery';
import { X, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoGridProps {
  photos: GalleryPhoto[];
  onDelete?: (photo: GalleryPhoto) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  onUpdateUploaderName?: (id: string, uploaderName: string) => void;
  isAdmin?: boolean;
}

export default function PhotoGrid({ photos, onDelete, onUpdateCaption, onUpdateUploaderName, isAdmin = false }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isEditingUploader, setIsEditingUploader] = useState(false);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftUploader, setDraftUploader] = useState('');

  const handleSaveCaption = () => {
    if (selectedPhoto && onUpdateCaption) {
      onUpdateCaption(selectedPhoto.id, draftCaption);
      setSelectedPhoto({ ...selectedPhoto, caption: draftCaption });
    }
    setIsEditingCaption(false);
  };

  const handleSaveUploader = () => {
    if (selectedPhoto && onUpdateUploaderName) {
      onUpdateUploaderName(selectedPhoto.id, draftUploader);
      setSelectedPhoto({ ...selectedPhoto, uploaderName: draftUploader });
    }
    setIsEditingUploader(false);
  };

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center text-mid-gray">
        <p className="text-lg">No photos uploaded yet.</p>
        <p className="text-sm mt-2">Share the QR code for guests to start uploading!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-light-gray"
            onClick={() => setSelectedPhoto(photo)}
          >
            {photo.url ? (
              photo.fileType?.startsWith('video/') ? (
                <video 
                  src={photo.url} 
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  autoPlay muted loop playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={photo.url} 
                  alt={`Uploaded by ${photo.uploaderName}`} 
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              )
            ) : (
              <div className="w-full h-full animate-pulse bg-sage/20"></div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white text-sm font-medium truncate">{photo.uploaderName}</p>
              {photo.caption && <p className="text-white/90 text-xs mt-1 truncate">{photo.caption}</p>}
              {photo.uploadedAt && (
                <p className="text-white/80 text-xs">{format(new Date(photo.uploadedAt), 'MMM d, h:mm a')}</p>
              )}
            </div>
            
            {isAdmin && onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-charcoal/95 z-50 flex items-center justify-center p-4 md:p-8">
          <button 
            onClick={() => { setSelectedPhoto(null); setIsEditingCaption(false); setIsEditingUploader(false); }}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center">
            {selectedPhoto.fileType?.startsWith('video/') ? (
              <video 
                src={selectedPhoto.url} 
                controls autoPlay
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={selectedPhoto.url} 
                alt="Enlarged gallery photo" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            
            <div className="mt-4 flex items-center justify-between w-full max-w-lg bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex-1 mr-4">
                {isEditingUploader ? (
                  <div className="flex items-center mb-1">
                    <p className="text-white font-medium text-sm text-white/70 mr-2">Uploaded by</p>
                    <input 
                      type="text" 
                      value={draftUploader}
                      onChange={(e) => setDraftUploader(e.target.value)}
                      className="bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-l px-2 py-0.5 text-sm focus:outline-none w-32"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveUploader}
                      className="bg-sage text-white px-2 py-0.5 rounded-r text-sm font-medium hover:bg-dark-sage"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center group/uploader mb-1">
                    <p className="text-white font-medium text-sm text-white/70">Uploaded by {selectedPhoto.uploaderName}</p>
                    {isAdmin && onUpdateUploaderName && (
                      <button 
                        onClick={() => { setDraftUploader(selectedPhoto.uploaderName); setIsEditingUploader(true); }}
                        className="ml-2 text-white/50 hover:text-white text-xs underline opacity-0 group-hover/uploader:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
                
                {selectedPhoto.uploadedAt && (
                  <p className="text-white/50 text-xs mb-2">{format(new Date(selectedPhoto.uploadedAt), 'MMMM d, yyyy - h:mm a')}</p>
                )}
                
                {isEditingCaption ? (
                  <div className="flex mt-2">
                    <input 
                      type="text" 
                      value={draftCaption}
                      onChange={(e) => setDraftCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-l px-3 py-1.5 text-sm focus:outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveCaption}
                      className="bg-sage text-white px-3 py-1.5 rounded-r text-sm font-medium hover:bg-dark-sage"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-start group/caption">
                    <p className="text-white text-sm whitespace-pre-wrap flex-1">
                      {selectedPhoto.caption || <span className="text-white/40 italic">No caption added</span>}
                    </p>
                    {isAdmin && onUpdateCaption && (
                      <button 
                        onClick={() => { setDraftCaption(selectedPhoto.caption || ''); setIsEditingCaption(true); }}
                        className="ml-2 text-white/50 hover:text-white text-xs underline opacity-0 group-hover/caption:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
              <a 
                href={selectedPhoto.url} 
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-sage hover:bg-dark-sage text-white rounded-lg transition-colors flex items-center"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
