'use client';

import React from 'react';
import type { Schema } from '../../../../../amplify/data/resource';

export function PublicSiteLayout({ children, siteTitle }: { children: React.ReactNode, siteTitle: string }) {
  // Client-side interactive layout shell
  return (
    <div className="public-site-wrapper min-h-screen flex flex-col transition-colors duration-500">
      <header className="fixed top-0 inset-x-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-lg border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold tracking-widest uppercase" style={{ color: 'var(--color-primary)' }}>
            {siteTitle}
          </div>
          <nav className="hidden md:flex space-x-10 text-sm font-medium tracking-wide uppercase">
            <a href="#hero" className="hover:opacity-60 transition-opacity" style={{ color: 'var(--color-primary)' }}>Welcome</a>
            <a href="#story" className="hover:opacity-60 transition-opacity" style={{ color: 'var(--color-primary)' }}>Our Story</a>
            <a href="#rsvp" className="px-6 py-2 rounded-full text-white transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>RSVP</a>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="py-8 text-center text-sm opacity-60">
        <p>Made with Wedding Steward</p>
      </footer>
    </div>
  );
}
