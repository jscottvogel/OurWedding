'use client';

import React from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { SiteLogo } from './SiteLogo';

export function PublicSiteLayout({ children, siteTitle, logoType, logoKey, enabledSections, sectionOrder }: { children: React.ReactNode, siteTitle: string, logoType?: string | null, logoKey?: string | null, enabledSections: Set<string>, sectionOrder: string[] }) {
  const sectionLabels: Record<string, string> = {
    'hero': 'Welcome',
    'story': 'Our Story',
    'events': 'Events',
    'travel': 'Travel',
    'party': 'Wedding Party',
    'registry': 'Registry',
    'faq': 'FAQs',
    'guestbook': 'Guestbook'
  };

  const navLinks = sectionOrder.filter(s => enabledSections.has(s) && sectionLabels[s] && s !== 'rsvp');
  // Client-side interactive layout shell
  return (
    <div className="public-site-wrapper min-h-screen flex flex-col transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-lg border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold tracking-widest uppercase flex items-center space-x-3" style={{ color: 'var(--color-primary)' }}>
            {(logoType && logoType !== 'TEXT_ONLY') ? (
              <SiteLogo type={logoType} customKey={logoKey} className="h-10 w-auto" />
            ) : (
              <span>{siteTitle}</span>
            )}
          </div>
          <nav className="hidden md:flex space-x-10 text-sm font-medium tracking-wide uppercase items-center">
            {navLinks.map(s => (
              <a key={s} href={`#${s}`} className="hover:opacity-60 transition-opacity" style={{ color: 'var(--color-primary)' }}>{sectionLabels[s]}</a>
            ))}
            {enabledSections.has('rsvp') && (
              <a href="#rsvp" className="px-6 py-2 rounded-full text-white transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>RSVP</a>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="py-12 text-center text-sm opacity-60 flex flex-col items-center">
        {(logoType && logoType !== 'TEXT_ONLY') ? (
          <div className="flex flex-col items-center space-y-4">
            <SiteLogo type={logoType} customKey={logoKey} className="w-12 h-12 opacity-80" color="var(--color-primary)" />
            <p>Made with Wedding Steward</p>
          </div>
        ) : (
          <p>Made with Wedding Steward</p>
        )}
      </footer>
    </div>
  );
}
