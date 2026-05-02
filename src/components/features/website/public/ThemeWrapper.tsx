'use client';

import React, { useEffect, useState } from 'react';
import { CustomCodeInjector } from './CustomCodeInjector';

export function ThemeWrapper({ children, defaultTheme }: { children: React.ReactNode, defaultTheme: any }) {
  const [previewConfig, setPreviewConfig] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WEBSITE_CONFIG_UPDATE') {
        setPreviewConfig(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const config = previewConfig || defaultTheme;

  const primaryColor = config?.primaryColor || '#e8caca';
  const accentColor = config?.accentColor || '#d4af37';
  const backgroundColor = config?.backgroundColor || '#fffdfd';
  const headingFont = config?.headingFont || 'Playfair Display, serif';
  const bodyFont = config?.bodyFont || 'Lato, sans-serif';
  const customCss = config?.customCss || '';
  const customJs = config?.customJs || '';

  return (
    <div 
      style={{
        '--color-primary': primaryColor,
        '--color-accent': accentColor,
        '--color-bg': backgroundColor,
        '--font-heading': headingFont,
        '--font-body': bodyFont,
        backgroundColor: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
        minHeight: '100vh',
      } as React.CSSProperties}
    >
      <CustomCodeInjector customCss={customCss} customJs={customJs} />
      {children}
    </div>
  );
}
