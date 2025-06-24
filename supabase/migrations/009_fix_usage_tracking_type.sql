-- ============================================================================
-- FIX USAGE TRACKING DATA TYPE
-- ============================================================================

-- Change monthly_prompts_used from INTEGER to a numeric type to support
-- fractional prompt costs (e.g., 1.5 for enhanced analysis).
-- Using DECIMAL for precise storage of fractional numbers.
ALTER TABLE public.profiles
ALTER COLUMN monthly_prompts_used TYPE DECIMAL(10, 2)
USING monthly_prompts_used::DECIMAL(10, 2);

-- Also ensure the default value is set correctly for the new type.
ALTER TABLE public.profiles
ALTER COLUMN monthly_prompts_used SET DEFAULT 0.00; 