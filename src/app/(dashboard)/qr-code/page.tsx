'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { Download, Copy, Printer, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function QRCodePage() {
  const { wedding, loading } = useWedding();
  const [uploadUrl, setUploadUrl] = useState('');
  const [localQr, setLocalQr] = useState<string | null>(null);

  useEffect(() => {
    if (wedding?.slug && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const baseUrl = hostname.includes('localhost') ? window.location.origin : 'https://weddingsteward.com';
      const url = `${baseUrl}/w/${wedding.slug}/upload`;
      setUploadUrl(url);
      
      if (!wedding.qrCodeUrl) {
        import('qrcode').then((QRCode) => {
          QRCode.default.toDataURL(url, { width: 500, margin: 1 })
            .then(qr => setLocalQr(qr))
            .catch(err => console.error(err));
        });
      }
    }
  }, [wedding]);

  const displayQr = wedding?.qrCodeUrl || localQr;

  const handleCopy = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl);
      toast.success('Upload link copied to clipboard');
    }
  };

  const handleDownload = () => {
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

  if (loading) {
    return <div className="p-8 animate-pulse text-sage font-medium text-lg">Loading QR code details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-sage mb-2 flex items-center">
          <ScanLine className="w-8 h-8 mr-3" />
          Guest Upload QR Code
        </h1>
        <p className="text-mid-gray">
          Print this code and place it on tables at your wedding. When guests scan it with their phone camera, they will be taken directly to your shared photo and video gallery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QR Code Display */}
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-10 flex flex-col items-center justify-center text-center">
          {displayQr ? (
            <>
              <div className="bg-ivory p-6 rounded-2xl border-2 border-sage border-dashed mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={displayQr} 
                  alt="Wedding QR Code" 
                  className="w-64 h-64 object-contain mix-blend-multiply" 
                />
              </div>
              <h2 className="text-2xl font-display text-charcoal mb-2">Scan to Upload</h2>
              <p className="text-mid-gray font-medium">{wedding?.coupleName1} & {wedding?.coupleName2}'s Wedding</p>
            </>
          ) : (
            <div className="text-mid-gray flex flex-col items-center">
              <ScanLine className="w-16 h-16 mb-4 text-light-gray animate-pulse" />
              <p>Your QR code is being generated...</p>
            </div>
          )}
        </div>

        {/* Actions & Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
            <h3 className="text-xl font-display text-sage mb-4">Sharing Options</h3>
            
            <div className="space-y-4">
              <button 
                onClick={handleDownload}
                disabled={!wedding?.qrCodeUrl}
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
            <h3 className="text-xl font-display text-sage mb-4">Direct Link</h3>
            <p className="text-sm text-mid-gray mb-4">
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
                className="bg-sage text-white px-4 py-2 rounded-r-lg font-medium hover:bg-dark-sage transition-colors flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
