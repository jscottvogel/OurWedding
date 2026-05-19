'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Camera, Check, QrCode } from 'lucide-react';

export function GalleryShare({ slug }: { slug: string }) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const hostname = window.location.hostname;
      const isCustomDomain = !hostname.includes('localhost') && !hostname.includes('weddingsteward.com') && !hostname.includes('amplifyapp.com');
      
      let baseUrl = window.location.origin;
      if (hostname.includes('weddingsteward.com')) {
        baseUrl = 'https://weddingsteward.com';
      }
      
      const path = isCustomDomain ? '/upload' : `/w/${slug}/upload`;
      const url = `${baseUrl}${path}`;
      setUploadUrl(url);

      import('qrcode').then((QRCode) => {
        QRCode.default.toDataURL(url, { width: 200, margin: 1 })
          .then(dataUrl => setQrCodeData(dataUrl))
          .catch(err => console.error('Failed to generate QR code', err));
      });
    }
  }, [slug]);

  const handleCopy = () => {
    if (uploadUrl) {
      navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!slug) return null;

  return (
    <div className="mt-12 bg-[var(--color-bg)]/80 backdrop-blur-md p-8 rounded-2xl border border-black/5 shadow-sm max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-left">
      <div className="flex-1 space-y-4">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Share Your Photos!</h3>
        <p className="text-charcoal/80 leading-relaxed">
          Help us capture every special moment. Scan the QR code or use the link below to upload photos directly from your phone.
        </p>
        <p className="text-xs text-charcoal/60 italic">
          Note: Uploaded images will be visible on the public gallery.
        </p>
        
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a 
            href={uploadUrl || `/w/${slug}/upload`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Camera className="w-5 h-5 mr-2" />
            Upload Photos
          </a>
          <button 
            onClick={handleCopy}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--color-primary)] font-medium hover:bg-black/5 transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
      
      <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-inner border border-gray-100 flex flex-col items-center">
        {qrCodeData ? (
          <img src={qrCodeData} alt="Upload QR Code" className="w-32 h-32 md:w-40 md:h-40" />
        ) : (
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 flex items-center justify-center animate-pulse rounded-lg">
            <QrCode className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <span className="text-[10px] font-medium text-gray-400 mt-2 uppercase tracking-wider">Scan to Upload</span>
      </div>
    </div>
  );
}
