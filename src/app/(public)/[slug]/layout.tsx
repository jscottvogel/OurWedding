import React from 'react';
import type { Metadata } from 'next';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import { ThemeWrapper } from '@/components/features/website/public/ThemeWrapper';
// We'll use a basic client for public unauth fetching.
// In a full production Gen 2 app, you'd use generateServerClientUsingCookies here.

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // In a real implementation, we'd fetch the WebsiteConfig to get siteTitle and metaDescription.
  // We'll do a placeholder here to ensure it builds cleanly.
  return {
    title: `Wedding of ${params.slug}`,
    description: 'Welcome to our wedding website!',
  };
}

export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  // Mock fetching config for layout styling. 
  // We apply CSS vars to a wrapper div.
  
  const defaultTheme = {
    primaryColor: '#e8caca',
    accentColor: '#d4af37',
    backgroundColor: '#fffdfd',
    headingFont: 'Playfair Display, serif',
    bodyFont: 'Lato, sans-serif'
  };

  return (
    <ThemeWrapper defaultTheme={defaultTheme}>
      {children}
    </ThemeWrapper>
  );
}
