-- ============================================================================
-- ENHANCED PROMPT USAGE TRACKING
-- ============================================================================

-- Drop the old integer-based increment function if it exists
DROP FUNCTION IF EXISTS public.increment_prompt_usage(user_id_param uuid);

-- Create a new, reliable function to increment usage by a specific cost
-- This will be the single source of truth for all prompt tracking.
CREATE OR REPLACE FUNCTION public.increment_prompt_usage_by_cost(user_id_param uuid, cost_param double precision)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment the monthly prompt usage in the profiles table by the specified cost.
    -- This handles both standard (1.0) and enhanced (1.5) prompts.
    UPDATE public.profiles
    SET monthly_prompts_used = monthly_prompts_used + cost_param
    WHERE id = user_id_param;
END;
$$; 