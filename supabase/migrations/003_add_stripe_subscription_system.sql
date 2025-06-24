-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table for Stripe subscription management
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    stripe_price_id text,
    status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'inactive')),
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'creator', 'usage_based')),
    monthly_prompt_limit integer DEFAULT 0,
    overage_rate decimal(10,4) DEFAULT 0.25, -- $0.25 per prompt after limit
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Create usage_tracking table for prompt usage tracking
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    prompt_count integer DEFAULT 0,
    overage_count integer DEFAULT 0,
    billing_period_start timestamp with time zone NOT NULL,
    billing_period_end timestamp with time zone NOT NULL,
    total_cost decimal(10,2) DEFAULT 0.00,
    overage_cost decimal(10,2) DEFAULT 0.00,
    last_prompt_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create payment_intents table for tracking individual payments
CREATE TABLE IF NOT EXISTS public.payment_intents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id text UNIQUE NOT NULL,
    amount integer NOT NULL, -- Amount in cents
    currency text DEFAULT 'usd',
    status text NOT NULL CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded')),
    description text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'inactive')),
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'creator', 'usage_based')),
ADD COLUMN IF NOT EXISTS monthly_prompts_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_prompt_limit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_cycle_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS billing_cycle_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for payment_intents
CREATE POLICY "Users can view their own payments" ON public.payment_intents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payment_intents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for subscription management
CREATE OR REPLACE FUNCTION public.check_prompt_usage_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile record;
    current_usage integer;
BEGIN
    -- Get user profile with subscription info
    SELECT * INTO user_profile 
    FROM public.profiles 
    WHERE id = user_id_param;
    
    -- If user doesn't exist or has unlimited plan, return true
    IF user_profile IS NULL OR user_profile.subscription_plan = 'usage_based' THEN
        RETURN true;
    END IF;
    
    -- For free users, check if they have exceeded their limit
    IF user_profile.subscription_plan = 'free' THEN
        RETURN user_profile.monthly_prompts_used < 3; -- Free users get 3 prompts
    END IF;
    
    -- For creator plan users, check monthly limit
    IF user_profile.subscription_plan = 'creator' THEN
        RETURN user_profile.monthly_prompts_used < user_profile.monthly_prompt_limit;
    END IF;
    
    -- Default to false if unknown plan
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_prompt_usage(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment the monthly prompt usage
    UPDATE public.profiles
    SET monthly_prompts_used = monthly_prompts_used + 1
    WHERE id = user_id_param;
    
    -- Log the usage in ai_interactions table (if it exists)
    -- This will be handled by the application layer
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reset monthly usage for all users at the start of their billing cycle
    UPDATE public.profiles
    SET monthly_prompts_used = 0
    WHERE billing_cycle_start <= NOW() - INTERVAL '1 month';
    
    -- Update billing cycle dates
    UPDATE public.profiles
    SET 
        billing_cycle_start = NOW(),
        billing_cycle_end = NOW() + INTERVAL '1 month'
    WHERE billing_cycle_start <= NOW() - INTERVAL '1 month';
END;
$$;

-- Create updated_at trigger functions for new tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_billing_period ON public.usage_tracking(billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON public.payment_intents(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status); 