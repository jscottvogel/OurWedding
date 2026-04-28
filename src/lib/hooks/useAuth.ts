import { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser, AuthUser } from 'aws-amplify/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [weddingId, setWeddingId] = useState<string | null>(null);
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
          const groups = payload['cognito:groups'] as string[];
          setRole(groups?.[0] || 'admin');
          setWeddingId((payload['custom:wedding_id'] as string) || null);
          setVendorId((payload['custom:vendor_id'] as string) || null);
        }
      } catch (err) {
        setUser(null);
        setRole(null);
        setWeddingId(null);
        setVendorId(null);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  return { user, role, weddingId, vendorId, loading };
}
