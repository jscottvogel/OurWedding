import { redirect } from 'next/navigation';
import { PublicSiteLayout } from '@/components/features/website/public/PublicSiteLayout';
import { HeroSection, OurStorySection, EventsSection, TravelSection, WeddingPartySection, GallerySection, RegistrySection, FaqSection, GuestbookSection } from '@/components/features/website/public/Sections';
import { RsvpSection } from '@/components/features/website/public/RsvpSection';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../../amplify/data/resource';

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies: () => cookieStore,
  });

  const { data: configs } = await client.models.WebsiteConfig.list({
    filter: { subdomain: { eq: params.slug } },
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
    { data: guests }
  ] = await Promise.all([
    client.models.Wedding.get({ id: weddingId }, { authMode: 'apiKey' }),
    client.models.WebsiteStory.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' }),
    client.models.RunSheetItem.list({ filter: { weddingId: { eq: weddingId }, isPublic: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteTravel.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsitePartyMember.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteRegistry.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.WebsiteFaq.list({ filter: { weddingId: { eq: weddingId }, isVisible: { eq: true } }, authMode: 'apiKey' }),
    client.models.Guest.list({ filter: { weddingId: { eq: weddingId } }, authMode: 'apiKey' })
  ]);

  const story = stories[0];

  return (
    <PublicSiteLayout slug={params.slug}>
      <HeroSection wedding={wedding} />
      <OurStorySection story={story} />
      <EventsSection events={events} />
      <RsvpSection slug={params.slug} guests={guests} />
      <TravelSection travels={travels} />
      <WeddingPartySection partyMembers={partyMembers} />
      <GallerySection />
      <RegistrySection registries={registries} />
      <FaqSection faqs={faqs} />
      <GuestbookSection />
    </PublicSiteLayout>
  );
}
