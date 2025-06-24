"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, CreditCard, Star, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { stripeService, SUBSCRIPTION_PLANS } from '@/lib/stripe-client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 'limit_reached' | 'page_load' | 'manual';
  currentUsage?: {
    used: number;
    limit: number;
    plan: string;
  };
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  triggerReason = 'manual',
  currentUsage 
}: PaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadSubscriptionStatus();
    }
  }, [user, isOpen]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      // First try to get cached data to avoid unnecessary API calls
      const cachedStatus = stripeService.getCachedSubscriptionStatus(user.id);
      if (cachedStatus) {
        setSubscriptionStatus(cachedStatus);
        return;
      }

      // Only make API call if no cached data available
      const status = await stripeService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      console.error('User not authenticated');
      alert('Please sign in to upgrade your plan.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting checkout process for user:', user.id);
      // Create checkout session and redirect for Creator Plan
      await stripeService.createCheckoutSession('creator');
      // If we reach here, the redirect should have happened
      console.log('Checkout session created successfully');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, there was an error processing your request. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('token')) {
          errorMessage = 'Authentication error. Please sign out and sign back in, then try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Stripe')) {
          errorMessage = 'Payment system error. Please try again in a few moments.';
        } else if (error.message.includes('environment') || error.message.includes('configuration')) {
          errorMessage = 'Service configuration error. Please contact support.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPlanProgress = () => {
    if (!currentUsage) return 0;
    if (currentUsage.limit <= 0) return 0;
    return (currentUsage.used / currentUsage.limit) * 100;
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {triggerReason === 'limit_reached' ? 'Upgrade to Continue' : 'Unlock AI Power'}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            {triggerReason === 'limit_reached' 
              ? 'You\'ve used all your free prompts this month' 
              : 'Transform your videos with AI-powered editing'}
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage Display */}
        {currentUsage && triggerReason === 'limit_reached' && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Usage</span>
              <Badge className="bg-red-600 text-white text-xs">
                {currentUsage.used}/{currentUsage.limit}
              </Badge>
            </div>
            <Progress value={getPlanProgress()} className="h-1" />
          </div>
        )}

        {/* Pricing Display */}
        <div className="text-center py-4">
          <div className="text-3xl font-bold text-white mb-1">
            $20<span className="text-lg text-gray-400 font-normal">/month</span>
          </div>
          <p className="text-gray-400 text-sm">100 AI prompts + unlimited editing</p>
        </div>

        {/* Key Features - Compact */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
            <span>100 AI transformations per month</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
            <span>All professional editing tools</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
            <span>Unlimited exports & downloads</span>
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
            <span>Only $0.25 per additional prompt</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 py-3"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Start Creator Plan
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white py-2 text-sm"
          >
            Continue with 3 free prompts
          </Button>
        </div>

        {/* Trust Signal */}
        <p className="text-center text-xs text-gray-500 mt-4">
          🔒 Secure checkout • Cancel anytime • 30-day guarantee
        </p>
      </DialogContent>
    </Dialog>
  );
} 