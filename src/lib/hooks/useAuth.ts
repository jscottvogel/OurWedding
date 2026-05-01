import { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser, AuthUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Schema['WeddingMember']['type'][]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        setUser(currentUser);
        
        const payload = session.tokens?.accessToken?.payload;
        if (payload) {
          // Fetch user's wedding memberships from DynamoDB
          const { data: memberRecords } = await client.models.WeddingMember.list({
            filter: { profileId: { eq: currentUser.userId } }
          });
          
          setMemberships(memberRecords);
          let fetchedMemberRecords = memberRecords;
          
          // Self-healing migration for users created before the multi-wedding update
          if (fetchedMemberRecords.length === 0 && payload['custom:wedding_id']) {
            try {
              const cognitoWeddingId = payload['custom:wedding_id'] as string;
              const groups = payload['cognito:groups'] as string[];
              const cognitoRole = (payload['custom:role'] || (groups && groups[0]) || 'planner') as any;
              
              const { data: newMember } = await client.models.WeddingMember.create({
                profileId: currentUser.userId,
                weddingId: cognitoWeddingId,
                role: cognitoRole
              });
              
              if (newMember) {
                fetchedMemberRecords = [newMember];
                setMemberships(fetchedMemberRecords);
              }
            } catch (migrationErr) {
              console.error("Failed to self-heal user membership:", migrationErr);
            }
          }
          
          const localWeddingId = typeof window !== 'undefined' ? localStorage.getItem('weddingId') : null;
          
          // Determine active wedding: 
          // 1. local storage if it matches a valid membership
          // 2. first membership in the list
          // 3. null
          let activeId = null;
          let activeRole = 'guest'; // default fallback
          
          if (fetchedMemberRecords.length > 0) {
            const validLocal = fetchedMemberRecords.find(m => m.weddingId === localWeddingId);
            if (validLocal) {
              activeId = validLocal.weddingId;
              activeRole = validLocal.role || 'guest';
            } else {
              activeId = fetchedMemberRecords[0].weddingId;
              activeRole = fetchedMemberRecords[0].role || 'guest';
              if (typeof window !== 'undefined') {
                localStorage.setItem('weddingId', activeId);
              }
            }
          }
          
          setWeddingId(activeId);
          setRole(activeRole);
          
          setVendorId((payload['custom:vendor_id'] as string) || null);
        }
      } catch (err) {
        setUser(null);
        setRole(null);
        setWeddingId(null);
        setVendorId(null);
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  const setActiveWeddingId = (newWeddingId: string) => {
    const member = memberships.find(m => m.weddingId === newWeddingId);
    if (member) {
      setWeddingId(newWeddingId);
      setRole(member.role || 'guest');
      if (typeof window !== 'undefined') {
        localStorage.setItem('weddingId', newWeddingId);
      }
    }
  };

  return { user, role, weddingId, vendorId, loading, memberships, setActiveWeddingId };
}
