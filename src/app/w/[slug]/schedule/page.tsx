import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../../amplify/data/resource';
import { LiveSchedule, type ScheduleItem } from './LiveSchedule';

// Always fetch fresh data: the client calls router.refresh() every 60s so late changes to the run
// sheet (e.g. a "running late" shift) reach guests' phones.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Day-of Schedule',
  description: 'What is happening now and next at the wedding.',
  robots: { index: false, follow: false },
};

export default async function SchedulePage({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const client = generateServerClientUsingCookies<Schema>({ config: outputs, cookies: () => cookieStore });
  const slug = decodeURIComponent(params.slug);
  const { data: configs } = await client.models.WebsiteConfig.listWebsiteConfigBySubdomain(
    { subdomain: slug },
    { authMode: 'apiKey' }
  );
  const config = configs[0];
  if (!config) notFound();
  if (config.publishStatus === 'DRAFT') redirect(`/w/${params.slug}/coming-soon`);

  const [{ data: wedding }, items] = await Promise.all([
    client.models.Wedding.get({ id: config.weddingId }, { authMode: 'apiKey' }),
    (async () => {
      const out: Schema['RunSheetItem']['type'][] = [];
      let nextToken: string | null | undefined;
      do {
        const res: { data: Schema['RunSheetItem']['type'][]; nextToken?: string | null } =
          await client.models.RunSheetItem.list({
            filter: { weddingId: { eq: config.weddingId }, isPublic: { eq: true } },
            limit: 1000,
            nextToken,
            authMode: 'apiKey',
          });
        out.push(...res.data);
        nextToken = res.nextToken;
      } while (nextToken);
      return out;
    })(),
  ]);

  // Only public fields go to the client.
  const schedule: ScheduleItem[] = items
    .map((i) => ({
      id: i.id,
      time: i.eventTime,
      durationMinutes: i.durationMinutes ?? null,
      title: i.title,
      description: i.description ?? null,
      location: i.location ?? null,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const title = config.siteTitle || (wedding ? `${wedding.coupleName1} & ${wedding.coupleName2}` : 'Our Wedding');

  return <LiveSchedule title={title} weddingDate={wedding?.weddingDate ?? null} items={schedule} slug={slug} />;
}
