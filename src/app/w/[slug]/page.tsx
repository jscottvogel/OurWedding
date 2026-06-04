import { redirect } from 'next/navigation';
import { PublicSiteLayout } from '@/components/features/website/public/PublicSiteLayout';
import { HeroSection, OurStorySection, EventsSection, TravelSection, WeddingPartySection, GallerySection, RegistrySection, FaqSection, GuestbookSection } from '@/components/features/website/public/Sections';
import { RsvpSection } from '@/components/features/website/public/RsvpSection';
import { AnalyticsTracker } from '@/components/features/website/public/AnalyticsTracker';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../amplify/data/resource';

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookieStore,
  });

  const decodedSlug = decodeURIComponent(params.slug);
  const { data: configs } = await client.models.WebsiteConfig.list({
    filter: { 
      or: [
        { subdomain: { eq: decodedSlug } },
        { customDomain: { contains: decodedSlug } }
      ]
    },
    authMode: 'apiKey'
  });

  const config = configs[0];
  
  if (!config) {
    return <div className="min-h-screen flex items-center justify-center p-4"><div className="text-center"><h1 className="text-2xl font-bold mb-2 text-charcoal">Website Not Found</h1><p className="text-mid-gray">This wedding website does not exist.</p></div></div>;
  }

  if (config.publishStatus === 'DRAFT') {
    redirect(`/w/${params.slug}/coming-soon`);
  }

  const weddingId = config.weddingId;

  const [
    { data: wedding },
    { data: stories },
    { data: events },
    { data: travels },
    { data: partyMembers },
    { data: registries },
    { data: faqs },
    { data: guests },
    { data: vendors },
    { data: gallery },
    { data: guestbookEntries }
  ] = await Promise.all([
    client.models.Wedding.get({ id: weddingId }, { authMode: 'apiKey' }),
    client.models.WebsiteStory.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' }),
    client.models.RunSheetItem.list({ filter: { weddingId: { eq: weddingId }, isPublic: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteTravel.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    // client.models.WebsitePartyMember.list is deprecated
    Promise.resolve({ data: [] }),
    client.models.WebsiteRegistry.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteFaq.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.Guest.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey', limit: 1000 }),
    client.models.Vendor.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' }),
    client.models.GalleryUpload.list({ filter: { weddingId: { eq: weddingId }, showOnWebsite: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteGuestbook.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' })
  ]);

  const story = stories[0];
  const venueVendor = vendors.find(v => v.category?.toLowerCase() === 'venue');

  const siteTitle = config.siteTitle || (wedding ? `${wedding.coupleName1} & ${wedding.coupleName2}` : 'Our Wedding');

  const defaultSections = ["hero", "story", "events", "rsvp", "travel", "party", "gallery", "registry", "faq", "guestbook"];
  let enabledSections: Set<string>;
  let sectionOrder: string[];
  try {
    enabledSections = new Set(JSON.parse(config.enabledSections || '[]'));
    const parsedOrder = JSON.parse(config.sectionOrder || '[]');
    // Merge any missing sections from default to support new features (like gallery)
    const missingSections = defaultSections.filter(s => !parsedOrder.includes(s));
    sectionOrder = [...parsedOrder, ...missingSections];
  } catch(e) {
    enabledSections = new Set(defaultSections);
    sectionOrder = [...defaultSections];
  }

  const partyTags = config.partyTags || [];
  const partyGroups = partyTags.map(tag => {
    return {
      role: tag,
      members: guests.filter(g => {
        if (!g.tags) return false;
        const guestTags = g.tags.split(',').map(t => t.trim());
        return guestTags.includes(tag);
      })
    };
  }).filter(group => group.members.length > 0);

  return (
    <PublicSiteLayout 
      siteTitle={siteTitle}
      logoType={config.siteLogoType}
      logoKey={config.siteLogoKey}
      enabledSections={enabledSections}
      sectionOrder={sectionOrder}
    >
      {sectionOrder.map(section => {
        if (!enabledSections.has(section)) return null;
        switch (section) {
          case 'hero': return <HeroSection key={section} wedding={wedding} venueVendor={venueVendor} />;
          case 'story': return <OurStorySection key={section} story={story} />;
          case 'events': return <EventsSection key={section} events={events} />;
          case 'rsvp': return <RsvpSection key={section} slug={params.slug} guests={guests} wedding={wedding} />;
          case 'travel': return <TravelSection key={section} travels={travels} />;
          case 'party': return <WeddingPartySection key={section} partyGroups={partyGroups} />;
          case 'gallery': return <GallerySection key={section} photos={gallery} slug={params.slug} />;
          case 'registry': return <RegistrySection key={section} registries={registries} />;
          case 'faq': return <FaqSection key={section} faqs={faqs} />;
          case 'guestbook': return <GuestbookSection key={section} entries={guestbookEntries} slug={params.slug} />;
          default: return null;
        }
      })}
      <AnalyticsTracker weddingId={weddingId} configId={config.id} currentViewCount={config.viewCount || 0} />
    </PublicSiteLayout>
  );
}
