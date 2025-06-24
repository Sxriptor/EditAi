-- Add color_adjustments field to project_files table
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS color_adjustments jsonb DEFAULT '{}'::jsonb;

-- Add applied_luts field to project_files table  
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS applied_luts text[] DEFAULT ARRAY[]::text[];

-- Add ai_prompt_used field to project_files table
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS ai_prompt_used text;

-- Since we're simplifying to not use versions, we can optionally drop the version tables
-- (Commented out for safety - you can run these manually if you want to clean up)
-- DROP TABLE IF EXISTS public.project_versions CASCADE;
-- DROP TABLE IF EXISTS public.project_auto_saves CASCADE;