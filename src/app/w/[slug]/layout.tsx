import React from 'react';
import type { Metadata } from 'next';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { cookies } from 'next/headers';
import outputs from '@/../amplify_outputs.json';
import type { Schema } from '../../../../amplify/data/resource';
import { ThemeWrapper } from '@/components/features/website/public/ThemeWrapper';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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

  return {
    title: config?.siteTitle || `Wedding of ${params.slug}`,
    description: config?.metaDescription || 'Welcome to our wedding website!',
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

  const themeConfig = config || {
    primaryColor: '#e8caca',
    accentColor: '#d4af37',
    backgroundColor: '#fffdfd',
    headingFont: 'Playfair Display, serif',
    bodyFont: 'Lato, sans-serif'
  };

  return (
    <ThemeWrapper defaultTheme={themeConfig}>
      {children}
    </ThemeWrapper>
  );
}
