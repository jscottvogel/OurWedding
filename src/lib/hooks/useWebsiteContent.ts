import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useWebsiteContent() {
  const { weddingId } = useAuth();
  
  const [story, setStory] = useState<Schema['WebsiteStory']['type'] | null>(null);
  const [travels, setTravels] = useState<Schema['WebsiteTravel']['type'][]>([]);
  const [partyMembers, setPartyMembers] = useState<Schema['WebsitePartyMember']['type'][]>([]);
  const [registries, setRegistries] = useState<Schema['WebsiteRegistry']['type'][]>([]);
  const [faqs, setFaqs] = useState<Schema['WebsiteFaq']['type'][]>([]);

  useEffect(() => {
    if (!weddingId) return;

    const subs = [
      client.models.WebsiteStory.observeQuery({ filter: { weddingId: { eq: weddingId } } }).subscribe({
        next: ({ items }) => setStory(items[0] || null)
      }),
      client.models.WebsiteTravel.observeQuery({ filter: { weddingId: { eq: weddingId } } }).subscribe({
        next: ({ items }) => setTravels(items)
      }),
      client.models.WebsitePartyMember.observeQuery({ filter: { weddingId: { eq: weddingId } } }).subscribe({
        next: ({ items }) => setPartyMembers(items)
      }),
      client.models.WebsiteRegistry.observeQuery({ filter: { weddingId: { eq: weddingId } } }).subscribe({
        next: ({ items }) => setRegistries(items)
      }),
      client.models.WebsiteFaq.observeQuery({ filter: { weddingId: { eq: weddingId } } }).subscribe({
        next: ({ items }) => setFaqs(items)
      })
    ];

    return () => subs.forEach(s => s.unsubscribe());
  }, [weddingId]);

  return {
    story,
    travels,
    partyMembers,
    registries,
    faqs
  };
}
