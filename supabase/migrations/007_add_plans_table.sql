-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    stripe_price_id VARCHAR(100),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) DEFAULT 'month',
    prompt_limit INTEGER NOT NULL,
    overage_rate DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert default plans
INSERT INTO plans (name, stripe_price_id, price, prompt_limit, overage_rate, features) VALUES
(
    'Free',
    NULL,
    0,
    3,
    NULL,
    '{
        "features": [
            "3 AI prompts per month",
            "Basic editing tools",
            "720p exports"
        ]
    }'
),
(
    'Creator',
    current_setting('stripe.creator_price_id', true),
    20,
    250,
    0.25,
    '{
        "features": [
            "250 AI prompts per month",
            "All professional editing tools",
            "Unlimited exports & downloads",
            "$0.25 per additional prompt",
            "4K exports",
            "Priority support"
        ]
    }'
);

-- Add plan_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;

-- Update existing profiles to use free plan by default
UPDATE profiles 
SET plan_id = (SELECT id FROM plans WHERE name = 'Free')
WHERE plan_id IS NULL;

-- Add plan_id to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for plans table
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 