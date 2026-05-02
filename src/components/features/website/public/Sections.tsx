import React from 'react';

export function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center bg-gray-100 py-20">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Sarah & Tom</h1>
        <p className="text-xl md:text-2xl font-body mb-8">August 15, 2026 • New York, NY</p>
        <div className="flex justify-center space-x-4">
          <div className="text-center"><span className="text-3xl font-bold">45</span><p className="text-sm">Days</p></div>
          <div className="text-center"><span className="text-3xl font-bold">12</span><p className="text-sm">Hours</p></div>
        </div>
      </div>
    </section>
  );
}

export function OurStorySection() {
  return (
    <section id="story" className="py-20 px-4 max-w-4xl mx-auto">
      <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
      <div className="prose mx-auto font-body text-center">
        <p>We met in college and the rest is history...</p>
      </div>
    </section>
  );
}

export function EventsSection() {
  return (
    <section id="events" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Schedule of Events</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-2">Wedding Ceremony</h3>
          <p>4:00 PM • St. Patrick's Cathedral</p>
        </div>
      </div>
    </section>
  );
}

export function TravelSection() {
  return <section id="travel" className="py-20 bg-gray-50"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>Travel</h2></section>;
}

export function WeddingPartySection() {
  return <section id="party" className="py-20"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>Wedding Party</h2></section>;
}

export function GallerySection() {
  return <section id="gallery" className="py-20 bg-gray-50"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>Gallery</h2></section>;
}

export function RegistrySection() {
  return <section id="registry" className="py-20"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>Registry</h2></section>;
}

export function FaqSection() {
  return <section id="faq" className="py-20 bg-gray-50"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>FAQs</h2></section>;
}

export function GuestbookSection() {
  return <section id="guestbook" className="py-20"><h2 className="text-4xl font-heading text-center" style={{ color: 'var(--color-primary)' }}>Guestbook</h2></section>;
}
