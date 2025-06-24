-- ============================================================================
-- PHASE 3: ADD PROMPT ENHANCEMENT LEARNING & A/B TESTING FIELDS
-- ============================================================================

-- Add columns to the ai_interactions table to store the final enhanced prompt
-- and the strategy/model used to generate it. This is critical for A/B
-- testing and building a feedback loop to improve the enhancement system.

ALTER TABLE public.ai_interactions
ADD COLUMN enhanced_prompt TEXT,
ADD COLUMN strategy TEXT;

-- Add a comment to describe the purpose of the new columns for future reference.
COMMENT ON COLUMN public.ai_interactions.enhanced_prompt IS 'The final, AI-enhanced prompt that was sent to the image generation model.';
COMMENT ON COLUMN public.ai_interactions.strategy IS 'The enhancement strategy or model used (e.g., gpt-4-turbo, gpt-3.5-turbo, concise_template_v1) for A/B testing.'; 