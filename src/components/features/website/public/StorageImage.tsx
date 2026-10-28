'use client';

import React, { useState, useEffect } from 'react';
import { getFileUrl } from '@/lib/storage/files';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageKey: string;
  fileType?: string | null;
}

export function StorageImage({ storageKey, fileType, ...props }: StorageImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (storageKey) {
      getFileUrl(storageKey)
        .then((resolved) => {
          if (isMounted) setUrl(resolved);
        })
        .catch((err) => {
          console.error('Failed to load storage image:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  if (!url) {
    // You could return a skeleton loader or null here
    return <div className={`animate-pulse bg-gray-200 ${props.className || ''}`} style={props.style} />;
  }

  if (fileType?.startsWith('video/')) {
    // Render video for mp4, quicktime, etc.
    return (
      <video 
        src={url} 
        autoPlay 
        loop 
        muted 
        playsInline 
        className={props.className} 
        style={props.style}
      />
    );
  }

  return <img src={url} {...props} alt={props.alt ?? ''} />;
}
