'use client';

import React from 'react';

export function PublicSiteLayout({ children, slug }: { children: React.ReactNode, slug: string }) {
  // Client-side interactive layout shell
  return (
    <div className="public-site-wrapper min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {slug.replace(/-/g, ' ').toUpperCase()}
          </div>
          <nav className="hidden md:flex space-x-6 text-sm">
            {/* StickyNav will populate this based on enabled sections */}
            <a href="#hero" className="hover:opacity-70 transition-opacity">Welcome</a>
            <a href="#story" className="hover:opacity-70 transition-opacity">Our Story</a>
            <a href="#rsvp" className="hover:opacity-70 transition-opacity font-bold" style={{ color: 'var(--color-primary)' }}>RSVP</a>
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
