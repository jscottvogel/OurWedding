'use client';

import { useGallery } from '@/lib/hooks/useGallery';
import PhotoGrid from '@/components/features/gallery/PhotoGrid';
import { Download, Copy, Printer, ScanLine } from 'lucide-react';
import { zipAndDownloadGallery } from '@/lib/actions/gallery';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { useWedding } from '@/lib/hooks/useWedding';
import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useEffect, useState } from 'react';

export default function GalleryPage() {
  const { photos, loading: galleryLoading, deletePhoto, updatePhotoCaption, updatePhotoUploaderName, togglePhotoVisibility } = useGallery();
  const { weddingId } = useAuth();
  
  // QR Code state
  const { wedding, loading: weddingLoading } = useWedding();
  const { config, isLoading: configLoading } = useWebsiteConfig();
  const [uploadUrl, setUploadUrl] = useState('');
  const [localQr, setLocalQr] = useState<string | null>(null);

  useEffect(() => {
    if (wedding && !configLoading && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const baseUrl = hostname.includes('weddingsteward.com') ? 'https://weddingsteward.com' : window.location.origin;
      
      let finalUrl = '';
      if (config?.customDomain) {
        finalUrl = `https://${config.customDomain}/upload`;
      } else if (config?.subdomain) {
        finalUrl = `${baseUrl}/w/${config.subdomain}/upload`;
      } else {
        finalUrl = `${baseUrl}/w/${wedding.slug}/upload`;
      }
      
      setUploadUrl(finalUrl);
      
      import('qrcode').then((QRCode) => {
        QRCode.default.toDataURL(finalUrl, { width: 500, margin: 1 })
          .then(qr => setLocalQr(qr))
          .catch(err => console.error(err));
      });
    }
  }, [wedding, config, configLoading]);

  const displayQr = localQr;

  const handleCopy = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl);
      toast.success('Upload link copied to clipboard');
    }
  };

  const handleDownloadQr = () => {
    if (displayQr) {
      const a = document.createElement('a');
      a.href = displayQr;
      a.download = `WeddingSteward-QRCode-${wedding?.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('QR Code downloaded!');
    }
  };

  const handleExportGallery = async () => {
    if (!weddingId) return;
    try {
      const url = await zipAndDownloadGallery(weddingId);
      window.open(url, '_blank');
      toast.success('Gallery download started');
    } catch (e) {
      toast.error('Failed to download gallery');
    }
  };

  if (galleryLoading || weddingLoading || configLoading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading gallery...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2">Photo & Video Gallery</h1>
          <p className="text-mid-gray">Memories uploaded by your guests via the QR code.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportGallery}
            className="bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-dark-sage transition-colors flex items-center shadow-sm"
          >
            <Download className="w-5 h-5 mr-2" /> Download All
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-display text-sage mb-4 flex items-center">
          <ScanLine className="w-6 h-6 mr-3" />
          Guest Upload QR Code
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-8 flex flex-col items-center justify-center text-center">
            {displayQr ? (
              <>
                <div className="bg-ivory p-4 rounded-2xl border-2 border-sage border-dashed mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={displayQr} 
                    alt="Wedding QR Code" 
                    className="w-48 h-48 object-contain mix-blend-multiply" 
                  />
                </div>
                <h3 className="text-xl font-display text-charcoal mb-1">Scan to Upload</h3>
                <p className="text-sm text-mid-gray font-medium">{wedding?.coupleName1} & {wedding?.coupleName2}'s Wedding</p>
              </>
            ) : (
              <div className="text-mid-gray flex flex-col items-center">
                <ScanLine className="w-12 h-12 mb-4 text-light-gray animate-pulse" />
                <p>Your QR code is being generated...</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
              <h3 className="text-lg font-display text-sage mb-4">Sharing Options</h3>
              <div className="space-y-4">
                <button 
                  onClick={handleDownloadQr}
                  disabled={!displayQr}
                  className="w-full bg-sage text-white px-4 py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                  <Download className="w-5 h-5 mr-2" /> Download High-Res PNG
                </button>
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-white text-charcoal border border-light-gray px-4 py-3 rounded-lg font-medium hover:bg-light-gray transition-colors flex items-center justify-center shadow-sm"
                >
                  <Printer className="w-5 h-5 mr-2" /> Print Directly
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
              <h3 className="text-lg font-display text-sage mb-4">Direct Link</h3>
              <p className="text-xs text-mid-gray mb-3">
                If a guest is having trouble scanning the code, you can send them this direct upload link.
              </p>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={uploadUrl} 
                  className="flex-1 bg-ivory border border-light-gray rounded-l-lg px-3 py-2 text-sm text-charcoal outline-none"
                />
                <button 
                  onClick={handleCopy}
                  className="bg-sage text-white px-3 py-2 rounded-r-lg font-medium hover:bg-dark-sage transition-colors flex items-center"
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-light-gray shadow-sm">
        <div className="mb-6 flex justify-between items-center border-b border-light-gray pb-4">
          <h2 className="text-xl font-medium text-charcoal">All Uploads</h2>
          <span className="text-mid-gray font-medium">{photos.length} items</span>
        </div>
        
        <PhotoGrid 
          photos={photos} 
          onDelete={deletePhoto}
          onUpdateCaption={updatePhotoCaption}
          onUpdateUploaderName={updatePhotoUploaderName}
          onToggleVisibility={togglePhotoVisibility}
          isAdmin={true}
        />
      </div>
    </div>
  );
}
