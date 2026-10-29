import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { PublicSiteLayout } from '@/components/features/website/public/PublicSiteLayout';
import { HeroSection, OurStorySection, EventsSection, TravelSection, WeddingPartySection, GallerySection, RegistrySection, FaqSection, GuestbookSection } from '@/components/features/website/public/Sections';
import { RsvpSection } from '@/components/features/website/public/RsvpSection';
import { AnalyticsTracker } from '@/components/features/website/public/AnalyticsTracker';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../amplify/data/resource';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let config: Schema['WebsiteConfig']['type'] | undefined;
  try {
    const cookieStore = cookies();
    const client = generateServerClientUsingCookies<Schema>({
      config: outputs,
      cookies: () => cookieStore,
    });
    const decodedSlug = decodeURIComponent(params.slug);
    const { data: configs } = await client.models.WebsiteConfig.listWebsiteConfigBySubdomain(
      { subdomain: decodedSlug },
      { authMode: 'apiKey' }
    );
    config = configs[0];
  } catch (err) {
    console.error('generateMetadata failed for wedding site', err);
    return { title: 'Our Wedding' };
  }
  // Metadata resolves before loading.tsx starts streaming, so notFound() here produces a real
  // 404 status. (Calling it only in the page body would be too late: a 200 is already sent.)
  if (!config) notFound();

  {
    const title = config.siteTitle || 'Our Wedding';
    const description = config.metaDescription || `Join us to celebrate — ${title}`;
    const isPrivate = !!config.passwordProtected || config.publishStatus === 'DRAFT';
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(config.ogImageUrl ? { images: [{ url: config.ogImageUrl }] } : {}),
      },
      twitter: {
        card: config.ogImageUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(config.ogImageUrl ? { images: [config.ogImageUrl] } : {}),
      },
      robots: isPrivate ? { index: false, follow: false } : { index: true, follow: true },
    };
  }
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookieStore,
  });

  const decodedSlug = decodeURIComponent(params.slug);
  const { data: configs } = await client.models.WebsiteConfig.listWebsiteConfigBySubdomain(
    { subdomain: decodedSlug },
    { authMode: 'apiKey' }
  );

  const config = configs[0];
  
  if (!config) {
    notFound();
  }

  if (config.publishStatus === 'DRAFT') {
    redirect(`/w/${params.slug}/coming-soon`);
  }

  const weddingId = config.weddingId;

  // Guest and Vendor records are owner-only; the public site never reads them with the API key.
  // The venue comes from Wedding.venueName/venueAddress and RSVPs go through /api/rsvp/*.
  const [
    { data: wedding },
    { data: stories },
    { data: events },
    { data: travels },
    { data: registries },
    { data: faqs },
    { data: gallery },
    { data: guestbookEntries }
  ] = await Promise.all([
    client.models.Wedding.get({ id: weddingId }, { authMode: 'apiKey' }),
    client.models.WebsiteStory.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' }),
    client.models.RunSheetItem.list({ filter: { weddingId: { eq: weddingId }, isPublic: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteTravel.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteRegistry.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteFaq.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.GalleryUpload.list({ filter: { weddingId: { eq: weddingId }, showOnWebsite: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteGuestbook.list({ filter: { weddingId: { eq: weddingId }, isApproved: { eq: true } }, authMode: 'apiKey' })
  ]);

  const story = stories[0];
  const approvedGuestbookEntries = guestbookEntries.filter(e => e.isApproved === true && !e.isDeleted);

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

  // Wedding-party groups were derived from Guest tags, which are no longer publicly readable.
  // The section renders nothing when empty; a public party-member model would be needed to restore it.
  const partyGroups: { role: string; members: Schema['Guest']['type'][] }[] = [];

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
          case 'hero': return <HeroSection key={section} wedding={wedding} />;
          case 'story': return <OurStorySection key={section} story={story} />;
          case 'events': return <EventsSection key={section} events={events} />;
          case 'rsvp': return <RsvpSection key={section} slug={params.slug} guests={[]} wedding={wedding} />;
          case 'travel': return <TravelSection key={section} travels={travels} />;
          case 'party': return <WeddingPartySection key={section} partyGroups={partyGroups} />;
          case 'gallery': return <GallerySection key={section} photos={gallery} slug={params.slug} />;
          case 'registry': return <RegistrySection key={section} registries={registries} />;
          case 'faq': return <FaqSection key={section} faqs={faqs} />;
          case 'guestbook': return <GuestbookSection key={section} entries={approvedGuestbookEntries} slug={params.slug} />;
          default: return null;
        }
      })}
      <AnalyticsTracker weddingId={weddingId} configId={config.id} currentViewCount={config.viewCount || 0} />
    </PublicSiteLayout>
  );
}
