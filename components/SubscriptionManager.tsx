"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import { PaymentModal } from './PaymentModal';
import { useAuth } from '@/lib/auth-context';
import { stripeService } from '@/lib/stripe-client';

interface SubscriptionManagerProps {
  children: React.ReactNode;
}

interface SubscriptionContextType {
  subscriptionStatus: any;
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  checkCanUseAI: () => Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionManager');
  }
  return context;
};

export function SubscriptionManager({ children }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user && subscriptionStatus) {
      // Show modal on page load if user doesn't have active subscription
      if (!hasShownInitialModal && shouldShowModal()) {
        setShowPaymentModal(true);
        setHasShownInitialModal(true);
      }

      // Set up interval to show modal every 2 minutes for non-subscribers
      // But only check cached data to avoid excessive API calls
      const interval = setInterval(() => {
        // First try to get cached data
        const cachedStatus = stripeService.getCachedSubscriptionStatus(user.id);
        const currentStatus = cachedStatus || subscriptionStatus;
        
        if (currentStatus && shouldShowModalForStatus(currentStatus)) {
          setShowPaymentModal(true);
        }
      }, 120000); // 120 seconds = 2 minutes

      return () => clearInterval(interval);
    }
  }, [user, subscriptionStatus, hasShownInitialModal]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      console.log('[SubscriptionManager] Checking subscription status for user:', user.id);
      // First check if we have cached data
      const cachedStatus = stripeService.getCachedSubscriptionStatus(user.id);
      if (cachedStatus) {
        console.log('[SubscriptionManager] Using cached subscription status:', cachedStatus);
        setSubscriptionStatus(cachedStatus);
        return;
      }

      // Only make API call if no cached data
      console.log('[SubscriptionManager] No cached data, fetching from server...');
      const status = await stripeService.getSubscriptionStatus(user.id);
      console.log('[SubscriptionManager] Received subscription status from server:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('[SubscriptionManager] Error checking subscription status:', error);
      // Assume free plan if error
      setSubscriptionStatus({ plan: 'free', status: 'inactive' });
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      console.log('[SubscriptionManager] Forcing subscription status refresh for user:', user.id);
      // Force refresh from server
      const status = await stripeService.getSubscriptionStatus(user.id, true);
      console.log('[SubscriptionManager] Received fresh subscription status:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('[SubscriptionManager] Error refreshing subscription status:', error);
    }
  };

  const checkCanUseAI = async (): Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }> => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    try {
      // Use the client-side service to check usage
      const result = await stripeService.canUseAI(user.id);
      
      // If not allowed and it's a usage limit issue, show payment modal
      if (!result.allowed && result.reason?.includes('limit')) {
        setShowPaymentModal(true);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return { allowed: false, reason: 'Error checking subscription' };
    }
  };

  const shouldShowModalForStatus = (status: any) => {
    if (!status) return false;
    
    // Don't show modal if user has an active paid subscription
    if (status.plan === 'creator' && status.status === 'active') {
      return false;
    }
    
    // Show modal for free plan or any inactive/problematic status
    return status.plan === 'free' || 
           status.status === 'inactive' ||
           status.status === 'canceled' ||
           status.status === 'past_due';
  };

  const shouldShowModal = () => {
    if (!subscriptionStatus) return false;
    
    // Don't show modal if user has an active paid subscription
    if (subscriptionStatus.plan === 'creator' && subscriptionStatus.status === 'active') {
      return false;
    }
    
    // Show modal if user is on free plan or has inactive subscription
    return subscriptionStatus.plan === 'free' || 
           subscriptionStatus.status === 'inactive' ||
           subscriptionStatus.status === 'canceled' ||
           subscriptionStatus.status === 'past_due';
  };

  const handleModalClose = () => {
    setShowPaymentModal(false);
  };

  const getTriggerReason = () => {
    if (!hasShownInitialModal) return 'page_load';
    if (subscriptionStatus?.promptsUsed >= subscriptionStatus?.promptLimit) return 'limit_reached';
    return 'manual';
  };

  const contextValue: SubscriptionContextType = {
    subscriptionStatus,
    showPaymentModal,
    setShowPaymentModal,
    checkCanUseAI,
    refreshSubscriptionStatus
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
      
      {user && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleModalClose}
          triggerReason={getTriggerReason()}
          currentUsage={subscriptionStatus ? {
            used: subscriptionStatus.promptsUsed || 0,
            limit: subscriptionStatus.promptLimit || 3,
            plan: subscriptionStatus.plan || 'free'
          } : undefined}
        />
      )}
    </SubscriptionContext.Provider>
  );
} 