import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';
import { DEFAULT_SECTION_ORDER, THEME_PRESETS } from '../website-defaults';

const client = generateClient<Schema>();

export function useWebsiteConfig() {
  const { weddingId } = useAuth();
  const [config, setConfig] = useState<Schema['WebsiteConfig']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setIsLoading(false);
      return;
    }

    const sub = client.models.WebsiteConfig.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        if (items.length > 0) {
          setConfig(items[0]);
        } else {
          // Setup initial config if missing
          createInitialConfig(weddingId);
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error('Error fetching website config:', err);
        setIsLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId]);

  const createInitialConfig = async (wId: string) => {
    try {
      const defaultTheme = THEME_PRESETS[0];
      await client.models.WebsiteConfig.create({
        weddingId: wId,
        publishStatus: 'DRAFT',
        subdomain: `wedding-${wId.substring(0, 8)}`,
        passwordProtected: false,
        themeId: defaultTheme.id,
        primaryColor: defaultTheme.primaryColor,
        accentColor: defaultTheme.accentColor,
        backgroundColor: defaultTheme.backgroundColor,
        headingFont: defaultTheme.headingFont,
        bodyFont: defaultTheme.bodyFont,
        buttonStyle: 'ROUNDED',
        sectionOrder: JSON.stringify(DEFAULT_SECTION_ORDER),
        enabledSections: JSON.stringify(['hero', 'story', 'events', 'rsvp']),
        viewCount: 0
      });
    } catch (e) {
      console.error('Failed to create initial website config', e);
    }
  };

  const updateConfig = async (updates: Partial<Schema['WebsiteConfig']['type']>) => {
    if (!config) return;
    try {
      await client.models.WebsiteConfig.update({
        id: config.id,
        ...updates
      });
    } catch (e) {
      console.error('Failed to update config', e);
      throw e;
    }
  };

  return { config, isLoading, updateConfig };
}
