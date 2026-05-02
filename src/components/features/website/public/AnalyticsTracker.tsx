'use client';

import { useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export function AnalyticsTracker({ weddingId, configId, currentViewCount }: { weddingId: string, configId: string, currentViewCount: number }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const trackVisit = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const localKey = `visited_${weddingId}`;
        const isUnique = !localStorage.getItem(localKey);
        
        if (isUnique) {
          localStorage.setItem(localKey, 'true');
        }

        // Increment the global view count
        client.models.WebsiteConfig.update({
          id: configId,
          viewCount: currentViewCount + 1
        }).catch(console.error);

        // Find today's analytics record
        const { data: records } = await client.models.WebsiteAnalytics.list({
          filter: {
            and: [
              { weddingId: { eq: weddingId } },
              { dateString: { eq: today } }
            ]
          },
          authMode: 'apiKey'
        });

        if (records.length > 0) {
          const record = records[0];
          await client.models.WebsiteAnalytics.update({
            id: record.id,
            views: (record.views || 0) + 1,
            uniqueVisitors: (record.uniqueVisitors || 0) + (isUnique ? 1 : 0)
          }, { authMode: 'apiKey' });
        } else {
          await client.models.WebsiteAnalytics.create({
            weddingId,
            dateString: today,
            views: 1,
            uniqueVisitors: isUnique ? 1 : 0
          }, { authMode: 'apiKey' });
        }
      } catch (err) {
        console.error('Failed to track analytics:', err);
      }
    };

    // Delay tracking slightly to prioritize page load
    setTimeout(trackVisit, 1000);
  }, [weddingId, configId, currentViewCount]);

  return null; // Silent component
}
