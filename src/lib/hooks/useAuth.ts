import { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser, AuthUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

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
        
        const accessTokenPayload = session.tokens?.accessToken?.payload;
        const idTokenPayload = session.tokens?.idToken?.payload;
        
        if (accessTokenPayload) {
          // Fetch user's wedding memberships from DynamoDB
          const { data: memberRecords } = await client.models.WeddingMember.list({
            filter: { profileId: { eq: currentUser.userId } }
          });
          
          setMemberships(memberRecords);
          let fetchedMemberRecords = memberRecords;
          
          // Self-healing migration for users created before the multi-wedding update
          // Custom attributes are stored in the ID token in Cognito
          const legacyWeddingId = idTokenPayload?.['custom:wedding_id'] as string;
          
          if (fetchedMemberRecords.length === 0 && legacyWeddingId) {
            try {
              const groups = accessTokenPayload['cognito:groups'] as string[];
              const cognitoRole = (idTokenPayload?.['custom:role'] || (groups && groups[0]) || 'planner') as any;
              
              const { data: newMember } = await client.models.WeddingMember.create({
                profileId: currentUser.userId,
                weddingId: legacyWeddingId,
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

          // Resolve pending invitations for newly invited users
          const userEmail = idTokenPayload?.email as string;
          if (fetchedMemberRecords.length === 0 && userEmail) {
            try {
              const { data: invitations } = await client.models.WeddingMember.list({
                filter: { profileId: { eq: `INVITE_${userEmail}` } }
              });

              if (invitations && invitations.length > 0) {
                fetchedMemberRecords = [];
                for (const invite of invitations) {
                  const { data: updatedMember } = await client.models.WeddingMember.update({
                    id: invite.id,
                    profileId: currentUser.userId
                  });
                  if (updatedMember) {
                    fetchedMemberRecords.push(updatedMember);
                  }
                }
                setMemberships(fetchedMemberRecords);
              }
            } catch (inviteErr) {
              console.error("Failed to resolve pending invitations:", inviteErr);
            }
          }

          // Self-heal missing Profile record for the current user
          if (userEmail) {
            try {
              const { data: profiles } = await client.models.Profile.listProfileByCognitoSub({
                cognitoSub: currentUser.userId
              });
              
              if (!profiles || profiles.length === 0) {
                await client.models.Profile.create({
                  cognitoSub: currentUser.userId,
                  email: userEmail
                });
              }
            } catch (profileErr) {
              console.error("Failed to self-heal user profile:", profileErr);
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
          
          setVendorId((idTokenPayload?.['custom:vendor_id'] as string) || null);
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
