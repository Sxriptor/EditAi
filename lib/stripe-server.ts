import Stripe from 'stripe';
import { supabase } from './supabase';

// Server-side only Stripe service
let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripeInstance;
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

export const stripeServer = {
  // Create or retrieve Stripe customer
  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<string> {
    const stripe = getStripe();
    
    try {
      // Check if customer already exists in our database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (profile?.stripe_customer_id) {
        console.log('Found existing Stripe customer:', profile.stripe_customer_id);
        return profile.stripe_customer_id;
      }

      console.log('Creating new Stripe customer for user:', userId);
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });

      console.log('Created Stripe customer:', customer.id);

      // Save customer ID to our database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      if (updateError) {
        console.error('Error saving customer ID to database:', updateError);
        
        // Check if the error is due to missing column (schema mismatch)
        if (updateError.message?.includes('column "stripe_customer_id" of relation "profiles" does not exist')) {
          console.error('Database schema missing stripe_customer_id column. Please run migrations.');
          // For now, continue with the customer ID even if we can't save it
          console.warn('Continuing with Stripe customer ID:', customer.id, 'but it cannot be saved to database');
          return customer.id;
        }
        
        // For other errors, log but don't fail - customer was created successfully
        console.warn('Customer created in Stripe but not saved to database. Customer ID:', customer.id);
      }

      return customer.id;
    } catch (error) {
      console.error('Error in createOrGetCustomer:', error);
      throw new Error(`Failed to create or retrieve customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Create checkout session
  async createCheckoutSession(
    userId: string,
    priceId: string,
    mode: 'subscription' | 'payment' = 'subscription',
    successUrl: string,
    cancelUrl: string,
    customerId?: string
  ): Promise<Stripe.Checkout.Session> {
    const stripe = getStripe();
    
    let customerIdToUse = customerId;
    
    // If no customer ID provided, try to get it from database
    if (!customerIdToUse) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name')
        .eq('id', userId)
        .single();

      customerIdToUse = profile?.stripe_customer_id;
    }

    if (!customerIdToUse) {
      console.error('Customer not found in database for user:', userId);
      throw new Error('Customer not found. Please ensure your profile is set up correctly.');
    }

    console.log('Creating Stripe checkout session for customer:', customerIdToUse);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerIdToUse,
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

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      console.log('Checkout session created successfully:', session.id);
      return session;
    } catch (error) {
      console.error('Failed to create Stripe checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Check if user can use AI features
  async canUseAI(userId: string): Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }> {
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
  },

  // Record prompt usage
  async recordPromptUsage(userId: string): Promise<void> {
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
  },

  // Get user's subscription status
  async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    status: string;
    promptsUsed: number;
    promptLimit: number;
    billingCycleEnd?: string;
  }> {
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
  },

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<void> {
    const stripe = getStripe();
    
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
  }
}; 