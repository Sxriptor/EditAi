import Stripe from 'stripe';
import { supabase } from './supabase';

// Initialize Stripe (server-side only)
const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
  });
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  promptLimit: number;
  overageRate: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    promptLimit: 3,
    overageRate: 0,
    features: ['3 AI prompts per month', 'Basic editing tools', 'Standard exports']
  },
  creator: {
    id: 'creator',
    name: 'Creator Plan',
    price: 2000, // $20.00 in cents
    promptLimit: 100,
    overageRate: 25, // $0.25 in cents
    features: ['100 AI prompts included', 'All editing tools', 'Unlimited exports', 'Priority support', '$0.25 per additional prompt']
  },
  usage_based: {
    id: 'usage_based',
    name: 'Usage Based',
    price: 0,
    promptLimit: -1, // Unlimited
    overageRate: 25, // $0.25 per prompt
    features: ['Pay per prompt', 'All editing tools', 'Unlimited exports', 'Priority support', '$0.25 per prompt']
  }
};

export class StripeService {
  
  // Create or retrieve Stripe customer
  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if customer already exists in our database
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profile?.stripe_customer_id) {
        return profile.stripe_customer_id;
      }

      const stripe = getStripeInstance();
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });

      // Save customer ID to our database
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting Stripe customer:', error);
      throw error;
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(
    userId: string, 
    amount: number, 
    currency: string = 'usd',
    description?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      const stripe = getStripeInstance();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: profile.stripe_customer_id,
        description,
        metadata: { userId },
        automatic_payment_methods: { enabled: true }
      });

      // Log payment intent in our database
      await supabase
        .from('payment_intents')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount,
          currency,
          status: paymentIntent.status,
          description
        });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Create subscription for Creator Plan
  async createSubscription(
    userId: string,
    priceId: string,
    planType: 'creator' | 'usage_based' = 'creator'
  ): Promise<Stripe.Subscription> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      const stripe = getStripeInstance();
      
      const subscription = await stripe.subscriptions.create({
        customer: profile.stripe_customer_id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, planType }
      });

      // Save subscription to our database
      await this.saveSubscriptionToDB(userId, subscription, planType);

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Save subscription data to database
  private async saveSubscriptionToDB(
    userId: string, 
    subscription: Stripe.Subscription,
    planType: 'creator' | 'usage_based'
  ): Promise<void> {
    const plan = SUBSCRIPTION_PLANS[planType];
    
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0]?.price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_type: planType,
        monthly_prompt_limit: plan.promptLimit,
        overage_rate: plan.overageRate / 100 // Convert cents to dollars
      });

    // Update profile with subscription info
    await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_plan: planType,
        monthly_prompt_limit: plan.promptLimit,
        billing_cycle_start: new Date(subscription.current_period_start * 1000).toISOString(),
        billing_cycle_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', userId);
  }

  // Check if user can use AI features
  async canUseAI(userId: string): Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, monthly_prompts_used, monthly_prompt_limit, subscription_status')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { allowed: false, reason: 'User not found' };
      }

      // If user has active subscription (not free), allow AI usage
      if (profile.subscription_plan === 'creator' && profile.subscription_status === 'active') {
        const promptsLeft = profile.monthly_prompt_limit - profile.monthly_prompts_used;
        return { 
          allowed: promptsLeft > 0, 
          reason: promptsLeft <= 0 ? 'Monthly prompt limit reached' : undefined,
          promptsLeft 
        };
      }

      if (profile.subscription_plan === 'usage_based' && profile.subscription_status === 'active') {
        return { allowed: true }; // Usage-based has no limits
      }

      // Free users get limited prompts
      if (profile.subscription_plan === 'free') {
        const promptsLeft = 3 - profile.monthly_prompts_used;
        return { 
          allowed: promptsLeft > 0, 
          reason: promptsLeft <= 0 ? 'Free tier limit reached. Please upgrade to continue.' : undefined,
          promptsLeft 
        };
      }

      return { allowed: false, reason: 'No active subscription' };
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return { allowed: false, reason: 'Error checking subscription' };
    }
  }

  // Increment prompt usage
  async recordPromptUsage(userId: string): Promise<void> {
    try {
      // Increment usage counter
      const { error } = await supabase.rpc('increment_prompt_usage', {
        user_id_param: userId
      });

      if (error) throw error;

      // Log the AI interaction
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: userId,
          prompt_text: 'AI prompt used',
          prompt_type: 'command',
          ai_response: { recorded: true },
          model_used: 'gpt-4'
        });

    } catch (error) {
      console.error('Error recording prompt usage:', error);
      throw error;
    }
  }

  // Get user's subscription status
  async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    status: string;
    promptsUsed: number;
    promptLimit: number;
    billingCycleEnd?: string;
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, monthly_prompts_used, monthly_prompt_limit, billing_cycle_end')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('User not found');
      }

      return {
        plan: profile.subscription_plan || 'free',
        status: profile.subscription_status || 'inactive',
        promptsUsed: profile.monthly_prompts_used || 0,
        promptLimit: profile.monthly_prompt_limit || 3,
        billingCycleEnd: profile.billing_cycle_end
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .single();

      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });

      // Update database
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(
    userId: string,
    priceId: string,
    mode: 'subscription' | 'payment' = 'subscription',
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: profile.stripe_customer_id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId }
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService(); 