'use client';

import { useGallery } from '@/lib/hooks/useGallery';
import PhotoGrid from '@/components/features/gallery/PhotoGrid';
import { Download, Share2 } from 'lucide-react';
import { zipAndDownloadGallery } from '@/lib/actions/gallery';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function GalleryPage() {
  const { photos, loading, deletePhoto } = useGallery();
  const { weddingId } = useAuth();

  const handleExport = async () => {
    if (!weddingId) return;
    try {
      const url = await zipAndDownloadGallery(weddingId);
      window.open(url, '_blank');
      toast.success('Gallery download started');
    } catch (e) {
      toast.error('Failed to download gallery');
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading gallery...</div>;
  }

  const handleShare = () => {
    // Navigate to QR code page or copy link
    toast.info('Head to the Dashboard or QR Code page to share your upload link!');
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Photo & Video Gallery</h1>
          <p className="text-mid-gray">Memories uploaded by your guests via the QR code.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleShare}
            className="bg-white border border-light-gray text-charcoal px-4 py-2 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center shadow-sm"
          >
            <Share2 className="w-5 h-5 mr-2" /> Share Link
          </button>
          <button 
            onClick={handleExport}
            className="bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-dark-sage transition-colors flex items-center shadow-sm"
          >
            <Download className="w-5 h-5 mr-2" /> Download All
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-light-gray shadow-sm">
        <div className="mb-6 flex justify-between items-center border-b border-light-gray pb-4">
          <h2 className="text-xl font-medium text-charcoal">All Uploads</h2>
          <span className="text-mid-gray font-medium">{photos.length} items</span>
        </div>
        
        <PhotoGrid 
          photos={photos} 
          onDelete={deletePhoto}
          isAdmin={true}
        />
      </div>
    </div>
  );
}
