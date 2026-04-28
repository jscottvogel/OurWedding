'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useVendorPortal() {
  const { vendorId, loading: authLoading } = useAuth();
  
  const [vendor, setVendor] = useState<Schema['Vendor']['type'] | null>(null);
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [tasks, setTasks] = useState<Schema['ChecklistItem']['type'][]>([]);
  const [runSheetItems, setRunSheetItems] = useState<Schema['RunSheetItem']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchPortalData = async () => {
      try {
        if (!vendorId) {
          setLoading(false);
          return;
        }

        // Fetch the specific vendor using vendorId from the session
        const vendorResult = await client.models.Vendor.get({ id: vendorId });
        const myVendor = vendorResult.data;
        setVendor(myVendor || null);

        if (myVendor && myVendor.weddingId) {
          // Get the wedding details
          const weddingResult = await client.models.Wedding.get({ id: myVendor.weddingId });
          setWedding(weddingResult.data || null);
          
          // Get tasks assigned specifically to this vendor's company
          const taskSub = client.models.ChecklistItem.observeQuery({
            filter: { 
              weddingId: { eq: myVendor.weddingId },
            }
          }).subscribe({
            next: ({ items }) => {
              // Filter locally if necessary, or just show all vendor tasks
              // since assignedTo is a string we might just show ones matching company name
              const myTasks = items.filter(t => t.assignedTo?.includes(myVendor.companyName || ''));
              setTasks(myTasks);
            },
          });
          
          // Get run sheet items assigned to this vendorId
          const runSheetSub = client.models.RunSheetItem.observeQuery({
            filter: { weddingId: { eq: myVendor.weddingId } }
          }).subscribe({
            next: ({ items }) => {
              const myRunsheet = items.filter(t => t.assignedVendorIds?.includes(myVendor.id));
              setRunSheetItems(myRunsheet.sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || '')));
            }
          });
          
          setLoading(false);
          
          return () => {
            taskSub.unsubscribe();
            runSheetSub.unsubscribe();
          };
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load portal data', err);
        setLoading(false);
      }
    };
    
    fetchPortalData();
  }, [vendorId, authLoading]);

  return { vendor, wedding, tasks, runSheetItems, loading };
}
