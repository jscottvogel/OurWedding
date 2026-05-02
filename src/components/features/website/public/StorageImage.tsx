'use client';

import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageKey: string;
}

export function StorageImage({ storageKey, ...props }: StorageImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (storageKey) {
      getUrl({ path: storageKey })
        .then((res) => {
          if (isMounted) setUrl(res.url.toString());
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

  return <img src={url} {...props} />;
}
