'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { useWebsiteConfig } from '@/lib/hooks/useWebsiteConfig';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Copy, ExternalLink, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function QRQuickShare() {
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
        QRCode.default.toDataURL(finalUrl, { width: 300, margin: 1 })
          .then(url => setLocalQr(url))
          .catch(err => console.error(err));
      });
    }
  }, [wedding, config, configLoading]);

  const handleCopy = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl);
      toast.success('Link copied to clipboard');
    }
  };

  const displayQr = localQr;

  if (weddingLoading || configLoading) {
    return <div className="h-full bg-white rounded-xl border border-light-gray animate-pulse" />;
  }

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

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 flex flex-col h-full items-center text-center">
      <h2 className="text-xl font-display text-sage mb-6 self-start w-full text-left">Quick Share</h2>
      
      {displayQr ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="bg-ivory p-4 rounded-lg border border-light-gray mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayQr} alt="Wedding QR Code" className="w-32 h-32" />
          </div>
          
          <div className="w-full space-y-3">
            <button 
              onClick={handleDownload}
              className="w-full flex items-center justify-center py-2 px-4 border border-light-gray rounded-md hover:bg-light-gray transition-colors text-charcoal"
            >
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </button>
            <button 
              onClick={handleCopy}
              className="w-full flex items-center justify-center py-2 px-4 border border-light-gray rounded-md hover:bg-light-gray transition-colors text-charcoal"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </button>
            <Link 
              href="/qr-code"
              className="w-full flex items-center justify-center py-2 px-4 bg-sage text-white rounded-md hover:bg-dark-sage transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Manage QR Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-mid-gray w-full">
          <QrCode className="w-8 h-8 mb-4 text-light-gray animate-pulse" />
          <p className="text-sm">QR Code generating...</p>
        </div>
      )}
    </div>
  );
}
