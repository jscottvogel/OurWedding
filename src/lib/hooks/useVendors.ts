'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useVendors() {
  const { weddingId, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<Schema['Vendor']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const sub = client.models.Vendor.observeQuery({
      filter: { weddingId: { eq: weddingId } }
    }).subscribe({
      next: ({ items }) => {
        setVendors(items);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [weddingId, authLoading]);

  const addVendor = async (vendor: Omit<Schema['Vendor']['type'], 'id' | 'createdAt' | 'updatedAt' | 'weddingId'>) => {
    if (!weddingId) return;
    await client.models.Vendor.create({
      ...vendor,
      weddingId
    });
  };

  const updateVendor = async (id: string, updates: Partial<Schema['Vendor']['type']>) => {
    await client.models.Vendor.update({
      id,
      ...updates
    });
  };

  const deleteVendor = async (id: string) => {
    await client.models.Vendor.delete({ id });
  };

  return { vendors, loading, addVendor, updateVendor, deleteVendor };
}

export function useVendor(id: string) {
  const [vendor, setVendor] = useState<Schema['Vendor']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const sub = client.models.Vendor.observeQuery({
      filter: { id: { eq: id } }
    }).subscribe({
      next: ({ items }) => {
        setVendor(items[0] || null);
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [id]);

  return { vendor, loading };
}
