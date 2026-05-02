import React from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { format } from 'date-fns';
import { StorageImage } from './StorageImage';
import { StorageBackgroundImage } from './StorageBackgroundImage';

export function HeroSection({ wedding, venueVendor }: { wedding?: Schema['Wedding']['type'] | null, venueVendor?: Schema['Vendor']['type'] | null }) {
  if (!wedding) return null;
  let formattedDate = 'Date TBD';
  if (wedding.weddingDate) {
    const [year, month, day] = wedding.weddingDate.split('-').map(Number);
    formattedDate = format(new Date(year, month - 1, day), 'MMMM d, yyyy');
  }
  const hasHeroImage = !!wedding.heroImageKey;
  
  return (
    <section id="hero" className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden ${hasHeroImage ? 'bg-charcoal' : 'bg-transparent'}`}>
      {hasHeroImage && (
        <>
          <StorageBackgroundImage 
            storageKey={wedding.heroImageKey!}
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        </>
      )}
      
      <div className="relative z-20 text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 
          className={`text-6xl md:text-8xl font-heading mb-6 tracking-wide ${hasHeroImage ? 'text-white drop-shadow-xl' : ''}`}
          style={hasHeroImage ? {} : { color: 'var(--color-primary)' }}
        >
          {wedding.coupleName1} & {wedding.coupleName2}
        </h1>
        <div 
          className={`text-lg md:text-2xl font-body mb-12 tracking-[0.2em] uppercase ${hasHeroImage ? 'text-white/90 drop-shadow-md' : ''}`}
          style={hasHeroImage ? {} : { color: 'var(--color-primary)' }}
        >
          <div>{formattedDate}</div>
          {wedding.venueName && (
            <div className="mt-4 flex flex-col items-center space-y-2">
              {venueVendor?.website ? (
                <a 
                  href={venueVendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:opacity-80 transition-opacity font-bold"
                >
                  {wedding.venueName}
                </a>
              ) : (
                <span className="font-bold">{wedding.venueName}</span>
              )}
              
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueVendor?.address || wedding.venueName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm tracking-widest hover:underline opacity-80 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function OurStorySection({ story }: { story?: Schema['WebsiteStory']['type'] | null }) {
  if (!story || !story.coupleStory) return null;
  
  const hasImage = !!story.storyImageKey;

  return (
    <section id="story" className="py-24 bg-transparent">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
          <div className="w-24 h-1 mx-auto bg-[var(--color-accent)] opacity-50 rounded" />
        </div>
        <div className={`flex flex-col ${hasImage ? 'md:flex-row items-center gap-12' : 'max-w-3xl mx-auto items-center text-center'}`}>
          {hasImage && (
            <div className="w-full md:w-1/2">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <StorageBackgroundImage 
                  storageKey={story.storyImageKey!}
                  className="absolute inset-0 bg-cover bg-center"
                />
                <div className="absolute inset-0 bg-black/5" />
              </div>
            </div>
          )}
          <div className={`prose prose-lg font-body text-charcoal leading-relaxed whitespace-pre-wrap ${hasImage ? '' : 'text-center text-xl md:text-2xl'}`}>
            {story.coupleStory}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventsSection({ events }: { events?: Schema['RunSheetItem']['type'][] }) {
  if (!events || events.length === 0) return null;
  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''));
  
  return (
    <section id="events" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Schedule of Events</h2>
        <div className="space-y-4">
          {sortedEvents.map(event => (
            <div key={event.id} className="bg-[var(--color-bg)]/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{event.title}</h3>
                <p className="text-charcoal/70 mt-1">{event.description}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="font-medium text-lg" style={{ color: 'var(--color-accent)' }}>{event.eventTime}</p>
                {event.location && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-charcoal/50 hover:underline hover:text-charcoal/80 transition-colors flex items-center justify-end mt-1"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {event.location}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TravelSection({ travels }: { travels?: Schema['WebsiteTravel']['type'][] }) {
  if (!travels || travels.length === 0) return null;
  return (
    <section id="travel" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Travel & Accommodations</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {travels.map(t => (
            <div key={t.id} className="bg-[var(--color-bg)]/80 backdrop-blur-md p-6 rounded-xl border border-black/5 shadow-sm">
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{t.hotelName}</h3>
              {t.address && <p className="text-charcoal/70 mt-2">{t.address}</p>}
              {t.notes && <p className="mt-4 text-charcoal/80">{t.notes}</p>}
              {t.bookingUrl && (
                <a href={t.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--color-accent)' }}>
                  Book a Room &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WeddingPartySection({ partyMembers }: { partyMembers?: Schema['WebsitePartyMember']['type'][] }) {
  if (!partyMembers || partyMembers.length === 0) return null;
  return (
    <section id="party" className="py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Wedding Party</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {partyMembers.map(member => (
            <div key={member.id} className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-[var(--color-bg)]/50 overflow-hidden shadow-inner border-4 border-[var(--color-bg)]/80">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">{member.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>{member.name}</h3>
                <p className="font-medium text-sm" style={{ color: 'var(--color-accent)' }}>{member.role}</p>
                {member.bio && <p className="text-xs text-charcoal/70 mt-2 px-2">{member.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GallerySection() {
  return null; // Not implemented for MVP yet
}

export function RegistrySection({ registries }: { registries?: Schema['WebsiteRegistry']['type'][] }) {
  if (!registries || registries.length === 0) return null;
  return (
    <section id="registry" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-heading mb-12" style={{ color: 'var(--color-primary)' }}>Registry</h2>
        <p className="text-lg text-charcoal/70 mb-8 max-w-2xl mx-auto">Your presence at our wedding is the greatest gift of all. However, should you wish to help us celebrate with a gift, we are registered at the following stores.</p>
        <div className="flex flex-wrap justify-center gap-6">
          {registries.map(r => (
            <a key={r.id} href={r.registryUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--color-bg)]/80 backdrop-blur-md px-8 py-4 rounded-xl shadow-sm border border-black/5 hover:shadow-md transition-all hover:-translate-y-1 flex items-center space-x-3">
              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{r.registryName}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs?: Schema['WebsiteFaq']['type'][] }) {
  if (!faqs || faqs.length === 0) return null;
  const sortedFaqs = [...faqs].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return (
    <section id="faq" className="py-20 bg-transparent">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>FAQs</h2>
        <div className="space-y-6">
          {sortedFaqs.map(faq => (
            <div key={faq.id} className="border-b border-black/10 pb-6 bg-[var(--color-bg)]/40 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{faq.question}</h3>
              <p className="text-charcoal/80 whitespace-pre-wrap">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GuestbookSection() {
  return null; // Not implemented for MVP yet
}
