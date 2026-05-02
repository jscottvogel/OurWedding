import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useWebsiteAnalytics() {
  const { weddingId } = useAuth();
  const [data, setData] = useState<{ dateString: string, views: number, uniqueVisitors: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) return;

    const fetchAnalytics = async () => {
      try {
        // In a real production app with thousands of rows, you'd use a lambda or server-side filter for a date range.
        // For MVP, we'll list the analytics for this wedding and process the last 30 days.
        const { data: records } = await client.models.WebsiteAnalytics.list({
          filter: { weddingId: { eq: weddingId } }
        });
        
        setData(records.map(r => ({
          dateString: r.dateString,
          views: r.views || 0,
          uniqueVisitors: r.uniqueVisitors || 0
        })));
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [weddingId]);

  return { data, loading };
}
