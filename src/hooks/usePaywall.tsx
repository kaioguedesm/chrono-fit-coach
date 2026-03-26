import { useState, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { useUserRole } from './useUserRole';

export function usePaywall() {
  const { subscribed, loading: subLoading } = useSubscription();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isPremium = subscribed || isPersonal;
  const loading = subLoading || roleLoading;

  const requirePremium = useCallback((action?: () => void) => {
    if (isPremium) {
      action?.();
      return true;
    }
    setPaywallOpen(true);
    return false;
  }, [isPremium]);

  return {
    isPremium,
    loading,
    paywallOpen,
    setPaywallOpen,
    requirePremium,
  };
}
