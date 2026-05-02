import React from 'react';

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with slow zoom */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
        style={{ backgroundImage: 'url(/images/hero.png)' }}
      />
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      
      {/* Content */}
      <div className="relative z-20 text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-6xl md:text-8xl font-heading mb-6 text-white drop-shadow-xl tracking-wide">
          Sarah & Tom
        </h1>
        <p className="text-lg md:text-2xl font-body mb-12 text-white/90 drop-shadow-md tracking-[0.2em] uppercase">
          August 15, 2026 • New York, NY
        </p>
        
        {/* Glassmorphism countdown */}
        <div className="flex justify-center space-x-8 backdrop-blur-md bg-white/10 px-8 py-6 rounded-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] inline-flex">
          <div className="text-center w-24">
            <span className="text-5xl md:text-6xl font-light text-white drop-shadow-md">45</span>
            <p className="text-xs md:text-sm text-white/80 uppercase tracking-widest mt-2 font-medium">Days</p>
          </div>
          <div className="text-5xl text-white/40 font-light mt-1">:</div>
          <div className="text-center w-24">
            <span className="text-5xl md:text-6xl font-light text-white drop-shadow-md">12</span>
            <p className="text-xs md:text-sm text-white/80 uppercase tracking-widest mt-2 font-medium">Hours</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OurStorySection() {
  return (
    <section id="story" className="py-32 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
        <div className="w-24 h-1 mx-auto bg-[var(--color-accent)] opacity-50 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white/50">
           {/* Using the same image for demonstration, slightly zoomed */}
           <div 
             className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: 'url(/images/hero.png)', transform: 'scale(1.2) translateX(-10%)' }}
           />
           <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="prose prose-lg font-body text-gray-700 leading-relaxed">
          <p className="text-2xl italic text-gray-500 mb-8 font-heading">"We met in college and the rest is history..."</p>
          <p>It started with a simple hello in the campus library. Five years, three cities, and countless cups of coffee later, we are so excited to celebrate our love with all of our favorite people in the world.</p>
          <p className="mt-6">We can't wait to share this magical weekend with you in New York!</p>
        </div>
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
