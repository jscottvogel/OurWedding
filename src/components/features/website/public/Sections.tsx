import React from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { format } from 'date-fns';
import { StorageImage } from './StorageImage';
import { StorageBackgroundImage } from './StorageBackgroundImage';
import { Music } from 'lucide-react';

export function HeroSection({ wedding, venueVendor }: { wedding?: Schema['Wedding']['type'] | null, venueVendor?: Schema['Vendor']['type'] | null }) {
  if (!wedding) return null;
  let formattedDate = 'Date TBD';
  if (wedding.weddingDate) {
    const [year, month, day] = wedding.weddingDate.split('-').map(Number);
    formattedDate = new Date(year, month - 1, day).toLocaleDateString(undefined, { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  }
  const hasHeroImage = !!wedding.heroImageKey;
  
  const formatTime = (timeStr?: string, tz?: string) => {
    if (!timeStr) return '';
    try {
      const [hourStr, minStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      const timeFmt = `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
      return tz ? `${timeFmt} ${tz}` : timeFmt;
    } catch {
      return timeStr;
    }
  };

  const timeString = formatTime(wedding.weddingTime || undefined, wedding.timezone || undefined);
  
  return (
    <section id="hero" className={`relative min-h-[90vh] w-full overflow-hidden flex flex-col justify-end group ${hasHeroImage ? 'bg-dark-sage' : 'bg-transparent'}`}>
      {hasHeroImage ? (
        <>
          {/* Blurred backdrop to fill empty letterboxing elegantly */}
          <StorageBackgroundImage 
            storageKey={wedding.heroImageKey!}
            className="absolute inset-0 z-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
          />
          {/* Creative Oval Frame Foreground */}
          <div className="absolute inset-0 flex justify-center items-center py-6 pb-24 z-10 pointer-events-none">
            <div className="relative group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-auto">
              {/* Outer decorative ring */}
              <div className="absolute -inset-4 md:-inset-6 rounded-[50%] border-2 border-white/20 animate-pulse" />
              <div className="absolute -inset-8 md:-inset-12 rounded-[50%] border border-white/10" />
              {/* The Image */}
              <StorageImage 
                storageKey={wedding.heroImageKey!}
                alt="Couple"
                className="max-h-[300px] md:max-h-[450px] w-auto object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-[6px] md:ring-[8px] ring-white/15"
                style={{ borderRadius: '50%' }}
              />
            </div>
          </div>
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10 pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sage via-ivory to-light-terra opacity-80" />
      )}
      
      {/* Content */}
      <div className="relative z-20 p-8 md:p-16 w-full pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 
          className={`text-5xl md:text-7xl font-display mb-2 tracking-wide ${hasHeroImage ? 'text-white drop-shadow-xl' : ''}`}
          style={hasHeroImage ? {} : { color: 'var(--color-primary)' }}
        >
          {wedding.coupleName1} & {wedding.coupleName2}
        </h1>
        
        <div 
          className={`flex flex-col space-y-1 ${hasHeroImage ? 'text-ivory drop-shadow-md' : ''}`}
          style={hasHeroImage ? {} : { color: 'var(--color-primary)' }}
        >
          <span className="text-lg md:text-xl font-body font-medium tracking-wider">
            {formattedDate}
            {timeString && ` at ${timeString}`}
          </span>

          {wedding.venueName && (
            <div className="flex flex-col text-light-sage mt-2">
              <span className="font-medium text-lg font-body tracking-wider">{wedding.venueName}</span>
              <div className="flex items-center flex-wrap gap-3 mt-1">
                {wedding.venueAddress && (
                  <span className="text-sm opacity-90 font-body tracking-wider">{wedding.venueAddress}</span>
                )}
                {(wedding.venueAddress || venueVendor?.address) && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venueAddress || venueVendor?.address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:text-white transition-colors pointer-events-auto flex items-center border border-current rounded-full px-3 py-1"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Map
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function OurStorySection({ story }: { story?: Schema['WebsiteStory']['type'] | null }) {
  const hasImage = story && !!story.storyImageKey;
  const content = story?.coupleStory || "We're so excited to celebrate with you! Check back soon to read our story.";

  return (
    <section id="story" className="py-24 bg-transparent">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Our Story</h2>
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
            {content}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventsSection({ events }: { events?: Schema['RunSheetItem']['type'][] }) {
  const sortedEvents = events ? [...events].sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || '')) : [];
  
  return (
    <section id="events" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Schedule of Events</h2>
        {sortedEvents.length === 0 ? (
          <p className="text-center text-charcoal/70 text-lg">Event details are being finalized. Please check back later!</p>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map(event => (
              <div key={event.id} className="bg-[var(--color-bg)]/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{event.title}</h3>
                  <p className="text-charcoal/70 mt-1">{event.description}</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="font-medium text-lg" style={{ color: 'var(--color-accent)' }}>
                    {event.eventTime ? format(new Date(`2000-01-01T${event.eventTime}`), 'h:mm a') : ''}
                  </p>
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
        )}
      </div>
    </section>
  );
}

export function TravelSection({ travels }: { travels?: Schema['WebsiteTravel']['type'][] }) {
  return (
    <section id="travel" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Travel & Accommodations</h2>
        {!travels || travels.length === 0 ? (
          <p className="text-center text-charcoal/70 text-lg">We are finalizing travel recommendations. Please check back later!</p>
        ) : (
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
        )}
      </div>
    </section>
  );
}

export function WeddingPartySection({ partyGroups }: { partyGroups?: { role: string, members: Schema['Guest']['type'][] }[] }) {
  return (
    <section id="party" className="py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>Wedding Party</h2>
        {!partyGroups || partyGroups.length === 0 ? (
          <p className="text-center text-charcoal/70 text-lg">We are finalizing our wedding party details. Please check back later!</p>
        ) : (
          <div className="space-y-16">
            {partyGroups.map(group => {
              let roleName = group.role;
              if (group.members.length > 1) {
                if (roleName === 'Bridesmaid') roleName = 'Bridesmaids';
                else if (roleName === 'Groomsman') roleName = 'Groomsmen';
                else if (roleName === 'Usher') roleName = 'Ushers';
                else if (roleName === 'Reader') roleName = 'Readers';
                else if (roleName === 'Flower Girl') roleName = 'Flower Girls';
                else if (roleName === 'Ring Bearer') roleName = 'Ring Bearers';
                else if (roleName === 'Candle Lighter') roleName = 'Candle Lighters';
              }
              
              return (
                <div key={group.role}>
                  <h3 className="text-2xl font-heading text-center mb-8 border-b border-black/10 pb-4 inline-block mx-auto w-full max-w-sm" style={{ color: 'var(--color-accent)' }}>{roleName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center justify-center">
                    {group.members.map(member => (
                      <div key={member.id} className="space-y-4">
                        {member.photoUrl && (
                          <div className="w-32 h-32 mx-auto rounded-full bg-[var(--color-bg)]/50 overflow-hidden shadow-inner border-4 border-[var(--color-bg)]/80">
                            <img src={member.photoUrl} alt={member.firstName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>{member.firstName} {member.lastName}</h4>
                          {member.bio && <p className="text-sm text-charcoal/70 mt-2 px-2">{member.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

import { GalleryShare } from './GalleryShare';
import { GalleryCarousel } from './GalleryCarousel';

export function GallerySection({ photos, slug }: { photos?: Schema['GalleryUpload']['type'][], slug?: string }) {
  if (!photos || photos.length === 0) {
    return (
      <section id="gallery" className="py-20 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading mb-12" style={{ color: 'var(--color-primary)' }}>Gallery</h2>
          <p className="text-center text-charcoal/70 text-lg italic">Photos coming soon!</p>
          {slug && <GalleryShare slug={slug} />}
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20 bg-transparent overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading mb-12" style={{ color: 'var(--color-primary)' }}>Gallery</h2>
        
        <GalleryCarousel photos={photos} />
        
        {slug && (
          <div className="mt-8 px-4">
            <GalleryShare slug={slug} />
          </div>
        )}
      </div>
    </section>
  );
}

const REGISTRY_LOGOS: Record<string, string> = {
  'amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'target': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Target_logo.svg',
  'crate & barrel': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Crate_and_Barrel_logo.svg',
  'crate and barrel': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Crate_and_Barrel_logo.svg',
  'bed bath & beyond': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Bed_Bath_%26_Beyond_logo.svg',
  'macys': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Macy%27s_logo.svg',
  "macy's": 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Macy%27s_logo.svg',
  'pottery barn': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Pottery_Barn_logo.svg',
  'williams sonoma': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Williams-Sonoma_logo.svg',
  'wayfair': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Wayfair_logo.svg',
  'zola': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Zola_logo.svg',
  'the knot': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/The_Knot_logo.png'
};

function getFallbackLogo(name: string) {
  const normalized = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(REGISTRY_LOGOS)) {
    if (normalized.includes(key)) return url;
  }
  return null;
}

export function RegistrySection({ registries }: { registries?: Schema['WebsiteRegistry']['type'][] }) {
  return (
    <section id="registry" className="py-20 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading mb-12" style={{ color: 'var(--color-primary)' }}>Registry</h2>
        <p className="text-lg text-charcoal/70 mb-8 max-w-2xl mx-auto">Your presence at our wedding is the greatest gift of all. However, should you wish to help us celebrate with a gift, we are registered at the following stores.</p>
        {!registries || registries.length === 0 ? (
          <p className="text-center text-charcoal/70 italic">Registry links coming soon!</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {registries.map(r => {
              const fallbackUrl = getFallbackLogo(r.registryName);
              const hasImage = r.imageKey || fallbackUrl;
              
              return (
                <a key={r.id} href={r.registryUrl} target="_blank" rel="noopener noreferrer" className="bg-white overflow-hidden rounded-xl shadow-sm border border-black/5 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center w-48 min-h-[120px]">
                  {r.imageKey ? (
                    <div className="w-full h-32 p-4 flex items-center justify-center">
                      <StorageImage storageKey={r.imageKey} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : fallbackUrl ? (
                    <div className="w-full h-32 p-6 flex items-center justify-center">
                      <img src={fallbackUrl} alt={r.registryName} className="max-w-full max-h-full object-contain opacity-90" />
                    </div>
                  ) : null}
                  
                  {!hasImage && (
                    <div className="w-full p-4 flex-1 flex items-center justify-center text-center">
                      <span className="font-bold text-sm md:text-base" style={{ color: 'var(--color-primary)' }}>{r.registryName}</span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs?: Schema['WebsiteFaq']['type'][] }) {
  const sortedFaqs = faqs ? [...faqs].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) : [];
  return (
    <section id="faq" className="py-20 bg-transparent">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>FAQs</h2>
        {sortedFaqs.length === 0 ? (
          <p className="text-center text-charcoal/70 text-lg">More details coming soon!</p>
        ) : (
          <div className="space-y-6">
            {sortedFaqs.map(faq => (
              <div key={faq.id} className="border-b border-black/10 pb-6 bg-[var(--color-bg)]/40 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{faq.question}</h3>
                <p className="text-charcoal/80 whitespace-pre-wrap">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function GuestbookSection({ entries, slug }: { entries?: Schema['WebsiteGuestbook']['type'][], slug?: string }) {
  const approvedEntries = entries ? entries.filter(e => e.isApproved && !e.isDeleted) : [];

  return (
    <section id="guestbook" className="py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading mb-4" style={{ color: 'var(--color-primary)' }}>Guestbook</h2>
          <p className="text-lg text-charcoal/70 mb-6 max-w-2xl mx-auto">Leave a note, share a memory, or request a song for the dance floor!</p>
          
          {slug && (
            <a 
              href={`/w/${slug}/guestbook`}
              className="inline-block bg-[var(--color-accent)] text-white px-8 py-3 rounded-full font-medium shadow hover:shadow-md transition-all hover:-translate-y-1"
            >
              Sign the Guestbook
            </a>
          )}
        </div>

        {approvedEntries.length === 0 ? (
          <p className="text-center text-charcoal/50 italic py-12">Be the first to sign the guestbook!</p>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {approvedEntries.map(entry => (
              <div key={entry.id} className="break-inside-avoid bg-[var(--color-bg)]/80 backdrop-blur-md rounded-xl shadow-sm border border-black/5 overflow-hidden flex flex-col">
                {entry.mediaKey && (
                  <div className="w-full relative bg-black/5">
                    <StorageImage
                      storageKey={entry.mediaKey}
                      fileType={entry.mediaType}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  {entry.message && (
                    <p className="text-charcoal/80 italic mb-4 font-body leading-relaxed whitespace-pre-wrap">
                      "{entry.message}"
                    </p>
                  )}
                  
                  {entry.songRequest && (
                    <div className="flex items-center text-sm text-charcoal/70 bg-black/5 p-3 rounded mb-4">
                      <Music className="w-4 h-4 mr-2" style={{ color: 'var(--color-accent)' }} />
                      <span className="truncate">{entry.songRequest}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-2 border-t border-black/5">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                      - {entry.guestName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
