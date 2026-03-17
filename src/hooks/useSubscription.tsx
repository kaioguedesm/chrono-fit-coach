import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionState {
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('[Subscription] Function error:', error);
        // If we already had a successful check before, keep the previous state
        // to avoid flashing the paywall on transient errors
        if (!hasCheckedRef.current) {
          setSubscribed(false);
        }
      } else {
        hasCheckedRef.current = true;
        setSubscribed(data?.subscribed ?? false);
        setSubscriptionEnd(data?.subscription_end ?? null);
      }
    } catch (err) {
      console.error('[Subscription] Error checking:', err);
      if (!hasCheckedRef.current) {
        setSubscribed(false);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Don't check subscription until auth is fully loaded
  useEffect(() => {
    if (authLoading) {
      // Keep loading true while auth is still loading
      setLoading(true);
      return;
    }

    if (user && session?.access_token) {
      checkSubscription();
    } else {
      hasCheckedRef.current = false;
      setSubscribed(false);
      setLoading(false);
    }
  }, [user, session?.access_token, authLoading, checkSubscription]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!user || !session?.access_token) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, session?.access_token, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, subscriptionEnd, loading, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}
