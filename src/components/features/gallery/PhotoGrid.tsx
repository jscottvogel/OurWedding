'use client';

import { useState } from 'react';
import { GalleryPhoto } from '@/lib/hooks/useGallery';
import { X, Download, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoGridProps {
  photos: GalleryPhoto[];
  onDelete?: (photo: GalleryPhoto) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  onUpdateUploaderName?: (id: string, uploaderName: string) => void;
  onToggleVisibility?: (id: string, showOnWebsite: boolean) => void;
  isAdmin?: boolean;
}

export default function PhotoGrid({ photos, onDelete, onUpdateCaption, onUpdateUploaderName, onToggleVisibility, isAdmin = false }: PhotoGridProps) {
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
            
            {isAdmin && onToggleVisibility && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(photo.id, !photo.showOnWebsite); }}
                className={`absolute top-2 left-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ${photo.showOnWebsite ? 'bg-sage text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                title={photo.showOnWebsite ? 'Visible on website (click to hide)' : 'Hidden from website (click to show)'}
              >
                {photo.showOnWebsite ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}
            
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
        <div className="fixed inset-0 bg-charcoal/95 z-[100] overflow-y-auto flex">
          <div className="m-auto flex flex-col items-center max-w-5xl w-full p-4 md:p-8 relative min-h-screen justify-center">
            <button 
              onClick={() => { setSelectedPhoto(null); setIsEditingCaption(false); setIsEditingUploader(false); }}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>
            
            {selectedPhoto.fileType?.startsWith('video/') ? (
              <video 
                src={selectedPhoto.url} 
                controls autoPlay
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={selectedPhoto.url} 
                alt="Enlarged gallery photo" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            
            <div className="mt-6 flex items-start justify-between w-full max-w-2xl bg-charcoal/80 border border-white/10 backdrop-blur-md rounded-xl p-5 shadow-xl">
              <div className="flex-1 mr-4">
                {isEditingUploader ? (
                  <div className="flex items-center mb-2">
                    <p className="text-white font-medium text-sm mr-2 opacity-80">Uploaded by</p>
                    <input 
                      type="text" 
                      value={draftUploader}
                      onChange={(e) => setDraftUploader(e.target.value)}
                      className="bg-black/40 border border-white/20 text-white placeholder-white/40 rounded-l px-3 py-1 text-sm focus:outline-none focus:border-sage w-40"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveUploader}
                      className="bg-sage text-white px-3 py-1 rounded-r text-sm font-medium hover:bg-dark-sage transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center mb-2 group">
                    <p className="text-white font-medium text-sm opacity-90 flex items-center">
                      Uploaded by <span className="font-bold ml-1">{selectedPhoto.uploaderName}</span>
                    </p>
                    {isAdmin && onUpdateUploaderName && (
                      <button 
                        onClick={() => { setDraftUploader(selectedPhoto.uploaderName); setIsEditingUploader(true); }}
                        className="ml-3 p-1.5 text-white/60 hover:text-sage hover:bg-white/10 rounded transition-all"
                        title="Edit uploader name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                {selectedPhoto.uploadedAt && (
                  <p className="text-white/50 text-xs mb-3">{format(new Date(selectedPhoto.uploadedAt), 'MMMM d, yyyy - h:mm a')}</p>
                )}
                
                {isEditingCaption ? (
                  <div className="flex mt-2">
                    <input 
                      type="text" 
                      value={draftCaption}
                      onChange={(e) => setDraftCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 bg-black/40 border border-white/20 text-white placeholder-white/40 rounded-l px-3 py-2 text-sm focus:outline-none focus:border-sage"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveCaption}
                      className="bg-sage text-white px-4 py-2 rounded-r text-sm font-medium hover:bg-dark-sage transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-start group">
                    <p className="text-white text-sm whitespace-pre-wrap flex-1 leading-relaxed">
                      {selectedPhoto.caption || <span className="text-white/40 italic">No caption added</span>}
                    </p>
                    {isAdmin && onUpdateCaption && (
                      <button 
                        onClick={() => { setDraftCaption(selectedPhoto.caption || ''); setIsEditingCaption(true); }}
                        className="ml-3 p-1.5 text-white/60 hover:text-sage hover:bg-white/10 rounded transition-all"
                        title="Edit caption"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                  {isAdmin && onToggleVisibility && (
                    <button 
                      onClick={() => {
                        onToggleVisibility(selectedPhoto.id, !selectedPhoto.showOnWebsite);
                        setSelectedPhoto({ ...selectedPhoto, showOnWebsite: !selectedPhoto.showOnWebsite });
                      }}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors border ${selectedPhoto.showOnWebsite ? 'bg-sage/10 text-sage border-sage/20 hover:bg-sage/20' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                    >
                      {selectedPhoto.showOnWebsite ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                      {selectedPhoto.showOnWebsite ? 'Visible to Public' : 'Hidden from Public'}
                    </button>
                  )}
                  {selectedPhoto.url && (
                    <a 
                      href={selectedPhoto.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-dark-sage transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
