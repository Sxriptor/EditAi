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
    customerId?: string,
    planType: 'creator' | 'usage_based' = 'creator'
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
      metadata: { 
        userId,
        planType
      },
      subscription_data: {
        metadata: {
          userId,
          planType
        }
      }
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
  async canUseAI(userId: string, promptCost: number = 1.0): Promise<{ allowed: boolean; reason?: string; promptsLeft?: number }> {
    try {
      type ProfileWithPlan = {
        subscription_status: string | null;
        monthly_prompts_used: number;
        monthly_prompt_limit: number;
        plan_id: number | null;
        plans: {
          name: string;
          prompt_limit: number;
          overage_rate: number;
        } | null;
      };

      // Get profile with plan information (same as getSubscriptionStatus)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          subscription_status,
          monthly_prompts_used,
          monthly_prompt_limit,
          plan_id,
          plans (
            name,
            prompt_limit,
            overage_rate
          )
        `)
        .eq('id', userId)
        .single() as { data: ProfileWithPlan | null, error: any };

      if (error || !profile) {
        console.error('Error fetching profile for AI usage check:', error);
        return { allowed: false, reason: 'User not found' };
      }

      const planName = profile.plans?.name.toLowerCase() || 'free';
      const promptLimit = profile.plans?.prompt_limit || 3;
      const promptsUsed = profile.monthly_prompts_used || 0;

      console.log(`AI Usage Check for ${userId}:`, {
        plan: planName,
        status: profile.subscription_status,
        promptsUsed,
        promptLimit,
        promptCost
      });

      // Free users get limited prompts
      if (planName === 'free') {
        const remainingPrompts = 3 - promptsUsed;
        const allowed = remainingPrompts >= promptCost;
        return { 
          allowed, 
          reason: !allowed ? 'Free tier limit reached. Please upgrade to continue.' : undefined,
          promptsLeft: Math.floor(remainingPrompts)
        };
      }

      // Creator plan users with active subscription
      if (planName === 'creator' && profile.subscription_status === 'active') {
        const remainingPrompts = promptLimit - promptsUsed;
        const allowed = remainingPrompts >= promptCost;
        return { 
          allowed, 
          reason: !allowed ? 'Monthly prompt limit reached' : undefined,
          promptsLeft: Math.floor(remainingPrompts) 
        };
      }

      // Usage-based plan users (pay per prompt)
      if (planName === 'usage_based' && profile.subscription_status === 'active') {
        return { allowed: true }; // Usage-based has no limits, they pay per prompt
      }

      // Default case - inactive subscription or unknown plan
      return { allowed: false, reason: 'No active subscription or unknown plan' };

    } catch (error) {
      console.error('Error in canUseAI:', error);
      return { allowed: false, reason: 'Error checking subscription' };
    }
  },

  // Record prompt usage
  async recordPromptUsage(userId: string, promptCost: number = 1.0): Promise<void> {
    try {
      console.log(`Recording prompt usage for ${userId}: ${promptCost} prompts`);
      
      // Primary method: Direct update with error handling and retry
      let updateSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!updateSuccess && attempts < maxAttempts) {
        attempts++;
        
        try {
          // First get current usage
          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('monthly_prompts_used, plans(name)')
            .eq('id', userId)
            .single();

          if (fetchError) {
            console.error(`Attempt ${attempts}: Error fetching profile for usage recording:`, fetchError);
            throw fetchError;
          }

          const currentUsage = profile?.monthly_prompts_used || 0;
          const newUsage = currentUsage + promptCost;
          const planName = (profile as any)?.plans?.name || 'Unknown';

          console.log(`Attempt ${attempts}: Usage update: ${currentUsage} -> ${newUsage} (${planName} plan)`);

          // Update usage counter with the actual cost
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ monthly_prompts_used: newUsage })
            .eq('id', userId);

          if (updateError) {
            console.error(`Attempt ${attempts}: Error updating prompt usage:`, updateError);
            throw updateError;
          }

          console.log(`✅ Attempt ${attempts}: Successfully updated profiles table (${currentUsage} -> ${newUsage})`);
          updateSuccess = true;

        } catch (attemptError) {
          console.error(`Attempt ${attempts} failed:`, attemptError);
          
          if (attempts === maxAttempts) {
            // Final fallback: Use the database function for integer values only
            console.log('⚠️ Falling back to database RPC function for usage tracking');
            
            if (promptCost === 1.0) {
              // For standard prompts, use the existing increment function
              const { error: rpcError } = await supabase.rpc('increment_prompt_usage', {
                user_id_param: userId
              });
              
              if (rpcError) {
                console.error('❌ RPC fallback also failed:', rpcError);
                throw new Error(`All tracking methods failed. Last error: ${rpcError.message}`);
              } else {
                console.log('✅ RPC fallback succeeded for standard prompt');
                updateSuccess = true;
              }
            } else {
              // For fractional prompts, manually round and update
              console.log(`⚠️ Fractional prompt cost ${promptCost}, manually rounding to ${Math.ceil(promptCost)}`);
              
              for (let i = 0; i < Math.ceil(promptCost); i++) {
                const { error: rpcError } = await supabase.rpc('increment_prompt_usage', {
                  user_id_param: userId
                });
                
                if (rpcError) {
                  console.error('❌ Manual increment failed:', rpcError);
                  throw new Error(`Manual increment failed: ${rpcError.message}`);
                }
              }
              
              console.log(`✅ Manual increment succeeded (${Math.ceil(promptCost)} increments for ${promptCost} cost)`);
              updateSuccess = true;
            }
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }

      // Log the AI interaction with cost information (best effort, don't fail if this errors)
      try {
        const { error: logError } = await supabase
          .from('ai_interactions')
          .insert({
            user_id: userId,
            prompt_text: `AI prompt used (cost: ${promptCost})`,
            prompt_type: 'command',
            ai_response: { recorded: true, promptCost, method: updateSuccess ? 'direct' : 'fallback' },
            model_used: promptCost > 1 ? 'gpt-4 + anthropic' : 'gpt-4'
          });

        if (logError) {
          console.error('⚠️ Error logging AI interaction (non-critical):', logError);
        } else {
          console.log('✅ AI interaction logged successfully');
        }
      } catch (logError) {
        console.error('⚠️ Failed to log AI interaction (non-critical):', logError);
      }

      // Final verification: Check that the update actually happened
      try {
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('monthly_prompts_used')
          .eq('id', userId)
          .single();
          
        console.log(`🔍 Verification: User ${userId} now has ${verifyProfile?.monthly_prompts_used || 0} prompts used`);
      } catch (verifyError) {
        console.error('⚠️ Verification check failed (non-critical):', verifyError);
      }

      console.log(`✅ Successfully recorded ${promptCost} prompt usage for ${userId}`);
      
    } catch (error) {
      console.error('❌ Complete failure to record prompt usage:', error);
      throw error;
    }
  },

  // Get user's subscription status
  async getSubscriptionStatus(userId: string, forceRefresh = false): Promise<{
    plan: string;
    status: string;
    promptsUsed: number;
    promptLimit: number;
    billingCycleEnd?: string;
  }> {
    console.log('Getting subscription status for user:', userId);

    try {
      type ProfileWithPlan = {
        subscription_status: string | null;
        monthly_prompts_used: number;
        monthly_prompt_limit: number;
        billing_cycle_end: string | null;
        plan_id: number | null;
        plans: {
          name: string;
          prompt_limit: number;
          overage_rate: number;
        } | null;
      };

      // Get profile with plan information
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          subscription_status,
          monthly_prompts_used,
          monthly_prompt_limit,
          billing_cycle_end,
          plan_id,
          plans (
            name,
            prompt_limit,
            overage_rate
          )
        `)
        .eq('id', userId)
        .single() as { data: ProfileWithPlan | null, error: any };

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!profile) {
        console.log('Profile not found, returning free plan status');
        return {
          plan: 'free',
          status: 'inactive',
          promptsUsed: 0,
          promptLimit: 3
        };
      }

      console.log('Found profile with plan:', profile);

      return {
        plan: profile.plans?.name.toLowerCase() || 'free',
        status: profile.subscription_status || 'inactive',
        promptsUsed: profile.monthly_prompts_used || 0,
        promptLimit: profile.plans?.prompt_limit || 3,
        billingCycleEnd: profile.billing_cycle_end || undefined
      };
    } catch (error) {
      console.error('Error in getSubscriptionStatus:', error);
      // Return free plan on error
      return {
        plan: 'free',
        status: 'inactive',
        promptsUsed: 0,
        promptLimit: 3
      };
    }
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