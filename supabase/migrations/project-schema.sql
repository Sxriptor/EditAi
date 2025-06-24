-- Enhanced Project System Schema
-- This extends the existing database-schema.sql with project folder functionality

-- Create project_folders table (main project containers)
CREATE TABLE IF NOT EXISTS public.project_folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    thumbnail_url text,
    is_starred boolean DEFAULT false,
    is_public boolean DEFAULT false,
    tags text[] DEFAULT ARRAY[]::text[],
    folder_settings jsonb DEFAULT '{}'::jsonb
);

-- Create project_files table for individual files within projects
CREATE TABLE IF NOT EXISTS public.project_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    project_folder_id uuid REFERENCES public.project_folders ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    original_filename text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
    original_file_url text NOT NULL,
    processed_file_url text,
    thumbnail_url text,
    file_size bigint,
    file_metadata jsonb DEFAULT '{}'::jsonb,
    processing_status text DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'error')),
    is_current_edit boolean DEFAULT true,
    order_index integer DEFAULT 0
);

-- Create project_versions table for undo/redo functionality
CREATE TABLE IF NOT EXISTS public.project_versions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    project_file_id uuid REFERENCES public.project_files ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    version_number integer NOT NULL,
    version_name text,
    color_adjustments jsonb DEFAULT '{}'::jsonb,
    applied_luts text[] DEFAULT ARRAY[]::text[],
    processed_file_url text,
    thumbnail_url text,
    ai_prompt_used text,
    is_auto_save boolean DEFAULT false,
    is_current boolean DEFAULT false,
    UNIQUE(project_file_id, version_number)
);

-- Create project_auto_saves table for temporary saves before manual save
CREATE TABLE IF NOT EXISTS public.project_auto_saves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    project_file_id uuid REFERENCES public.project_files ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    color_adjustments jsonb DEFAULT '{}'::jsonb,
    applied_luts text[] DEFAULT ARRAY[]::text[],
    processed_file_url text,
    session_id text NOT NULL,
    is_dirty boolean DEFAULT true,
    UNIQUE(project_file_id, session_id)
);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_auto_saves ENABLE ROW LEVEL SECURITY;

-- Policies for project_folders
CREATE POLICY "Users can view their own project folders" ON public.project_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project folders" ON public.project_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project folders" ON public.project_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project folders" ON public.project_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for project_files
CREATE POLICY "Users can view their project files" ON public.project_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their project files" ON public.project_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their project files" ON public.project_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their project files" ON public.project_files
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for project_versions
CREATE POLICY "Users can view their project versions" ON public.project_versions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their project versions" ON public.project_versions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for project_auto_saves
CREATE POLICY "Users can manage their own auto saves" ON public.project_auto_saves
    FOR ALL USING (auth.uid() = user_id);

-- Storage policies for project files
CREATE POLICY "Users can upload project files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view project files" ON storage.objects
    FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "Users can update their project files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their project files" ON storage.objects
    FOR DELETE USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.project_folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.project_files
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.project_auto_saves
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to manage version history
CREATE OR REPLACE FUNCTION public.manage_version_history()
RETURNS trigger AS $$
BEGIN
    -- Mark previous version as not current
    UPDATE public.project_versions 
    SET is_current = false 
    WHERE project_file_id = NEW.project_file_id AND is_current = true;
    
    -- Set new version as current
    NEW.is_current = true;
    
    -- Clean up old versions (keep only last 10)
    DELETE FROM public.project_versions
    WHERE project_file_id = NEW.project_file_id
    AND id NOT IN (
        SELECT id FROM (
            SELECT id FROM public.project_versions
            WHERE project_file_id = NEW.project_file_id
            ORDER BY version_number DESC
            LIMIT 10
        ) recent_versions
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version management
CREATE TRIGGER manage_version_history
    BEFORE INSERT ON public.project_versions
    FOR EACH ROW EXECUTE FUNCTION public.manage_version_history();

-- Function to auto-increment version numbers
CREATE OR REPLACE FUNCTION public.auto_increment_version()
RETURNS trigger AS $$
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO NEW.version_number
    FROM public.project_versions 
    WHERE project_file_id = NEW.project_file_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing version numbers
CREATE TRIGGER auto_increment_version
    BEFORE INSERT ON public.project_versions
    FOR EACH ROW 
    WHEN (NEW.version_number IS NULL)
    EXECUTE FUNCTION public.auto_increment_version(); 