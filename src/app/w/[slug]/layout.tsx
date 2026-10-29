import React from 'react';
import type { Metadata } from 'next';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../amplify/data/resource';
import { ThemeWrapper } from '@/components/features/website/public/ThemeWrapper';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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
  const config = configs?.[0];
  if (!config) return { title: 'Wedding website not found', robots: { index: false, follow: false } };

  return {
    title: config.siteTitle || 'Our Wedding',
    description: config.metaDescription || 'Welcome to our wedding website!',
  };
}

export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
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
  const config = configs?.[0];

  // Every page under /w/[slug] needs a real site. The layout renders outside this segment's
  // loading.tsx boundary, so notFound() here returns a true 404 before any streaming starts.
  if (!config) notFound();

  const themeConfig = config;

  return (
    <ThemeWrapper defaultTheme={themeConfig}>
      {children}
    </ThemeWrapper>
  );
}
