'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuth } from './useAuth';

const client = generateClient<Schema>();

export function useVendorPortal() {
  const { user, loading: authLoading } = useAuth();
  
  const [vendor, setVendor] = useState<Schema['Vendor']['type'] | null>(null);
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [tasks, setTasks] = useState<Schema['ChecklistItem']['type'][]>([]);
  const [runSheetItems, setRunSheetItems] = useState<Schema['RunSheetItem']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    // In a real implementation, the vendor's email from Cognito would link to the Vendor record
    // For MVP, we fetch the first vendor record the user has access to
    const fetchPortalData = async () => {
      try {
        // Find the vendor profile for the logged in user
        const vendorResult = await client.models.Vendor.list({
          // filter: { email: { eq: user?.email } }
        });
        
        const myVendor = vendorResult.data[0];
        setVendor(myVendor || null);

        if (myVendor && myVendor.weddingId) {
          // Get the wedding details
          const weddingResult = await client.models.Wedding.list({
            filter: { id: { eq: myVendor.weddingId } }
          });
          setWedding(weddingResult.data[0] || null);
          
          // Get tasks assigned to this vendor
          const taskSub = client.models.ChecklistItem.observeQuery({
            filter: { 
              weddingId: { eq: myVendor.weddingId },
              // In real app, filter by assignedTo: myVendor.companyName
            }
          }).subscribe({
            next: ({ items }) => setTasks(items),
          });
          
          // Get run sheet items
          const runSheetSub = client.models.RunSheetItem.observeQuery({
            filter: { weddingId: { eq: myVendor.weddingId } }
          }).subscribe({
            next: ({ items }) => {
              setRunSheetItems(items.sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || '')));
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
  }, [user, authLoading]);

  return { vendor, wedding, tasks, runSheetItems, loading };
}
