'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

interface StorageBackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  storageKey: string;
}

export function StorageBackgroundImage({ storageKey, className, style, ...props }: StorageBackgroundImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (storageKey) {
      getUrl({ path: storageKey })
        .then((res) => {
          if (isMounted) setUrl(res.url.toString());
        })
        .catch((err) => {
          console.error('Failed to load storage image for background:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  if (!url) {
    return <div className={`animate-pulse bg-gray-200 ${className || ''}`} style={style} {...props} />;
  }

  return (
    <div 
      className={className} 
      style={{ ...style, backgroundImage: `url(${url})` }} 
      {...props} 
    />
  );
}
