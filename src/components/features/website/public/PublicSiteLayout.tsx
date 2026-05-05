'use client';

import React, { useState } from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { SiteLogo } from './SiteLogo';
import { Menu, X } from 'lucide-react';

export function PublicSiteLayout({ children, siteTitle, logoType, logoKey, enabledSections, sectionOrder }: { children: React.ReactNode, siteTitle: string, logoType?: string | null, logoKey?: string | null, enabledSections: Set<string>, sectionOrder: string[] }) {
  const sectionLabels: Record<string, string> = {
    'hero': 'Welcome',
    'story': 'Our Story',
    'events': 'Events',
    'travel': 'Travel',
    'party': 'Wedding Party',
    'gallery': 'Gallery',
    'registry': 'Registry',
    'faq': 'FAQs',
    'guestbook': 'Guestbook'
  };

  const [localLogoType, setLocalLogoType] = React.useState(logoType);
  const [localLogoKey, setLocalLogoKey] = React.useState(logoKey);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WEBSITE_CONFIG_UPDATE') {
        const config = event.data.payload;
        setLocalLogoType(config.siteLogoType);
        setLocalLogoKey(config.siteLogoKey);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const navLinks = sectionOrder.filter(s => enabledSections.has(s) && sectionLabels[s] && s !== 'rsvp');
  // Client-side interactive layout shell
  return (
    <div className="public-site-wrapper min-h-screen flex flex-col transition-colors duration-500">
      <header className="relative z-50 bg-[var(--color-bg)] border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold tracking-widest uppercase flex items-center space-x-3" style={{ color: 'var(--color-primary)' }}>
            {(localLogoType && localLogoType !== 'TEXT_ONLY') ? (
              <SiteLogo type={localLogoType} customKey={localLogoKey} className="h-10 w-auto" />
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
          <button 
            className="md:hidden p-2 rounded-md hover:bg-black/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ color: 'var(--color-primary)' }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-[var(--color-bg)] border-b border-gray-200/50 shadow-lg py-4 px-6 flex flex-col space-y-4 z-40">
            {navLinks.map(s => (
              <a 
                key={s} 
                href={`#${s}`} 
                className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity block py-2" 
                style={{ color: 'var(--color-primary)' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {sectionLabels[s]}
              </a>
            ))}
            {enabledSections.has('rsvp') && (
              <a 
                href="#rsvp" 
                className="block text-center px-6 py-3 rounded-full text-white transition-all hover:shadow-lg text-sm font-medium tracking-wide uppercase w-full mt-2" 
                style={{ backgroundColor: 'var(--color-primary)' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                RSVP
              </a>
            )}
          </div>
        )}
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="py-12 text-center text-sm opacity-60 flex flex-col items-center">
        {(localLogoType && localLogoType !== 'TEXT_ONLY') ? (
          <div className="flex flex-col items-center space-y-4">
            <SiteLogo type={localLogoType} customKey={localLogoKey} className="w-12 h-12 opacity-80" color="var(--color-primary)" />
            <p>Made with Wedding Steward</p>
          </div>
        ) : (
          <p>Made with Wedding Steward</p>
        )}
      </footer>
    </div>
  );
}
