'use client';

import React, { useEffect, useRef } from 'react';
import type { Schema } from '../../../../../amplify/data/resource';

export function LivePreview({ config }: { config: Schema['WebsiteConfig']['type'] }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send the current config state to the iframe whenever it changes
      iframeRef.current.contentWindow.postMessage(
        { type: 'WEBSITE_CONFIG_UPDATE', payload: config },
        '*' // In production, restrict this to your actual domain
      );
    }
  }, [config]);

  // Use a special query param to let the public route know it's being previewed
  const previewUrl = `http://${config.subdomain}.localhost:3000?preview=true`;

  return (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      className="w-full h-full border-none"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
