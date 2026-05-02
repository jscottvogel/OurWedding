import { redirect } from 'next/navigation';
import { PublicSiteLayout } from '@/components/features/website/public/PublicSiteLayout';
import { HeroSection, OurStorySection, EventsSection, TravelSection, WeddingPartySection, GallerySection, RegistrySection, FaqSection, GuestbookSection } from '@/components/features/website/public/Sections';
import { RsvpSection } from '@/components/features/website/public/RsvpSection';

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  // In a real implementation we would fetch the WebsiteConfig by subdomain here.
  // For the MVP, we assume the config is found and PUBLISHED.
  
  // If config.publishStatus === 'DRAFT' -> redirect(`/${params.slug}/coming-soon`)
  // If config.passwordProtected -> check cookie, else redirect(`/${params.slug}/password`)

  return (
    <PublicSiteLayout slug={params.slug}>
      <HeroSection />
      <OurStorySection />
      <EventsSection />
      <RsvpSection slug={params.slug} />
      <TravelSection />
      <WeddingPartySection />
      <GallerySection />
      <RegistrySection />
      <FaqSection />
      <GuestbookSection />
    </PublicSiteLayout>
  );
}
