"use client"

import { SUBSCRIPTION_PLANS } from './stripe-server';

// Cache for subscription status
let subscriptionCache: {
  [userId: string]: {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  }
} = {};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Client-side Stripe service that makes API calls to our server
export class StripeClientService {
  
  private baseUrl = '/api/stripe';

  // Check if user can use AI features
  async canUseAI(userId: string): Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }> {
    try {
      const response = await fetch('/api/ai/usage-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to check AI usage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return { allowed: false, reason: 'Error checking subscription' };
    }
  }

  // Record prompt usage
  async recordPromptUsage(userId: string): Promise<void> {
    // This will be handled by the AI processing endpoint
    // No need for separate client call
  }

  // Get user's subscription status
  async getSubscriptionStatus(userId: string, forceRefresh = false): Promise<{
    plan: string;
    status: string;
    promptsUsed: number;
    promptLimit: number;
    billingCycleEnd?: string;
  }> {
    console.log('[StripeClient] Getting subscription status:', { userId, forceRefresh });
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && subscriptionCache[userId]) {
      const cached = subscriptionCache[userId];
      const now = Date.now();
      
      // Return cached data if it's still fresh
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log('[StripeClient] Returning cached subscription data:', cached.data);
        return cached.data;
      }
      
      // If there's an ongoing request, wait for it
      if (cached.promise) {
        console.log('[StripeClient] Waiting for ongoing subscription status request...');
        return cached.promise;
      }
    }

    console.log('[StripeClient] Fetching fresh subscription status from server...');
    // Create new request
    const requestPromise = this.fetchSubscriptionStatus(userId);
    
    // Store the promise to prevent duplicate requests
    if (!subscriptionCache[userId]) {
      subscriptionCache[userId] = { data: null, timestamp: 0 };
    }
    subscriptionCache[userId].promise = requestPromise;

    try {
      const data = await requestPromise;
      console.log('[StripeClient] Received fresh subscription data:', data);
      
      // Cache the result
      subscriptionCache[userId] = {
        data,
        timestamp: Date.now(),
        promise: undefined
      };
      
      return data;
    } catch (error) {
      console.error('[StripeClient] Error fetching subscription status:', error);
      // Clear the promise on error
      if (subscriptionCache[userId]) {
        subscriptionCache[userId].promise = undefined;
      }
      throw error;
    }
  }

  private async fetchSubscriptionStatus(userId: string) {
    console.log('[StripeClient] Making API request for subscription status:', userId);
    const response = await fetch(`${this.baseUrl}/subscription-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      console.error('[StripeClient] API request failed:', response.status, response.statusText);
      throw new Error('Failed to fetch subscription status');
    }

    const data = await response.json();
    console.log('[StripeClient] API response:', data);
    return data;
  }

  clearSubscriptionCache(userId?: string) {
    if (userId) {
      delete subscriptionCache[userId];
    } else {
      subscriptionCache = {};
    }
  }

  // Method to get cached data without making a request
  getCachedSubscriptionStatus(userId: string) {
    const cached = subscriptionCache[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    // Clear cache when subscription is cancelled
    this.clearSubscriptionCache(userId);
  }

  // Create checkout session (redirect to Stripe)
  async createCheckoutSession(plan: string): Promise<void> {
    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ 
          planType: plan,
          mode: 'subscription'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      
      if (url) {
        // Direct redirect if URL is provided
        window.location.href = url;
        return;
      }
      
      if (sessionId) {
        // Redirect to Stripe Checkout using sessionId
        const stripe = await import('@stripe/stripe-js').then(m => 
          m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        );
        
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId });
          if (error) {
            console.error('Stripe redirect error:', error);
            throw new Error(error.message || 'Failed to redirect to checkout');
          }
        } else {
          throw new Error('Failed to load Stripe');
        }
      } else {
        throw new Error('No session ID or URL returned from server');
      }
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      throw error;
    }
  }

  // Get auth token from Supabase
  private async getAuthToken(): Promise<string> {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    return session.access_token;
  }
}

// Export singleton instance
export const stripeService = new StripeClientService();

// Re-export subscription plans for convenience
export { SUBSCRIPTION_PLANS }; 