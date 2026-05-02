import React from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { format } from 'date-fns';

export function HeroSection({ wedding }: { wedding?: Schema['Wedding']['type'] | null }) {
  if (!wedding) return null;
  let formattedDate = 'Date TBD';
  if (wedding.weddingDate) {
    const [year, month, day] = wedding.weddingDate.split('-').map(Number);
    formattedDate = format(new Date(year, month - 1, day), 'MMMM d, yyyy');
  }
  const hasHeroImage = !!wedding.heroImageKey;
  const heroUrl = hasHeroImage ? `https://${process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${wedding.heroImageKey}` : null;
  
  return (
    <section id="hero" className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden ${hasHeroImage ? 'bg-charcoal' : 'bg-transparent'}`}>
      {hasHeroImage && (
        <>
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
            style={{ backgroundImage: `url(${heroUrl})` }}
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
        <p 
          className={`text-lg md:text-2xl font-body mb-12 tracking-[0.2em] uppercase ${hasHeroImage ? 'text-white/90 drop-shadow-md' : ''}`}
          style={hasHeroImage ? {} : { color: 'var(--color-primary)' }}
        >
          {formattedDate} {wedding.venueName ? `• ${wedding.venueName}` : ''}
        </p>
      </div>
    </section>
  );
}

export function OurStorySection({ story }: { story?: Schema['WebsiteStory']['type'] | null }) {
  if (!story || !story.coupleStory) return null;
  
  const hasImage = !!story.storyImageKey;
  const imageUrl = hasImage ? `https://${process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${story.storyImageKey}` : '';

  return (
    <section id="story" className="py-32 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
        <div className="w-24 h-1 mx-auto bg-[var(--color-accent)] opacity-50 rounded" />
      </div>
      <div className={hasImage ? "grid md:grid-cols-2 gap-16 items-center" : "max-w-3xl mx-auto"}>
        {hasImage && (
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white/50">
             <div 
               className="absolute inset-0 bg-cover bg-center"
               style={{ backgroundImage: `url(${imageUrl})`, transform: 'scale(1.05)' }}
             />
             <div className="absolute inset-0 bg-black/5" />
          </div>
        )}
        <div className={`prose prose-lg font-body text-charcoal leading-relaxed whitespace-pre-wrap ${hasImage ? '' : 'text-center text-xl md:text-2xl'}`}>
          {story.coupleStory}
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
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-charcoal">{event.title}</h3>
                <p className="text-mid-gray mt-1">{event.description}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="font-medium text-sage text-lg">{event.eventTime}</p>
                {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
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
            <div key={t.id} className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-charcoal">{t.hotelName}</h3>
              {t.address && <p className="text-mid-gray mt-2">{t.address}</p>}
              {t.notes && <p className="mt-4 text-gray-600">{t.notes}</p>}
              {t.bookingUrl && (
                <a href={t.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sage font-medium hover:underline">
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
              <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 overflow-hidden shadow-inner">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">{member.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-charcoal">{member.name}</h3>
                <p className="text-sage font-medium text-sm">{member.role}</p>
                {member.bio && <p className="text-xs text-mid-gray mt-2 px-2">{member.bio}</p>}
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
        <p className="text-lg text-mid-gray mb-8">Your presence at our wedding is the greatest gift of all. However, should you wish to help us celebrate with a gift, we are registered at the following stores.</p>
        <div className="flex flex-wrap justify-center gap-6">
          {registries.map(r => (
            <a key={r.id} href={r.registryUrl} target="_blank" rel="noopener noreferrer" className="bg-white px-8 py-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center space-x-3">
              <span className="font-bold text-charcoal">{r.registryName}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs?: Schema['WebsiteFaq']['type'][] }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section id="faq" className="py-20 bg-transparent">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>FAQs</h2>
        <div className="space-y-6">
          {faqs.map(faq => (
            <div key={faq.id} className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-charcoal mb-2">{faq.question}</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{faq.answer}</p>
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
