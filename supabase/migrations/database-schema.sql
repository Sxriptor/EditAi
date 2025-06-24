-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name text,
    avatar_url text,
    username text UNIQUE,
    website text,
    bio text,
    preferences jsonb DEFAULT '{}'::jsonb
);

-- Create user_editing_preferences table for AI learning
CREATE TABLE IF NOT EXISTS public.user_editing_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    editing_tone text DEFAULT 'balanced' CHECK (editing_tone IN ('cinematic', 'fun', 'chaotic', 'balanced', 'professional')),
    color_grading_style text DEFAULT 'natural' CHECK (color_grading_style IN ('warm', 'cool', 'natural', 'high_contrast', 'vintage', 'modern')),
    pacing_style text DEFAULT 'medium' CHECK (pacing_style IN ('fast_cut', 'medium', 'slow_mood', 'dynamic')),
    output_format text DEFAULT '1080p' CHECK (output_format IN ('720p', '1080p', '4K', 'vertical', 'square')),
    style_keywords text[] DEFAULT ARRAY[]::text[],
    learning_data jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Create ai_interactions table for logging AI conversations
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    project_id uuid REFERENCES public.projects ON DELETE CASCADE,
    prompt_text text NOT NULL,
    prompt_type text NOT NULL CHECK (prompt_type IN ('command', 'visual_transformation', 'descriptive_query')),
    attached_media_url text,
    media_metadata jsonb DEFAULT '{}'::jsonb,
    ai_response jsonb NOT NULL,
    user_feedback text CHECK (user_feedback IN ('positive', 'negative', 'modified')),
    response_time_ms integer,
    model_used text DEFAULT 'gpt-4',
    context_used jsonb DEFAULT '{}'::jsonb
);

-- Create prompt_templates table for reusable AI prompts
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    template_text text NOT NULL,
    category text NOT NULL CHECK (category IN ('color_grading', 'effects', 'pacing', 'style', 'technical')),
    is_public boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    tags text[]
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('image', 'video')),
    original_file_url text,
    processed_file_url text,
    thumbnail_url text,
    file_metadata jsonb DEFAULT '{}'::jsonb,
    color_adjustments jsonb DEFAULT '{}'::jsonb,
    applied_luts text[],
    prompt_history text[],
    is_public boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    tags text[]
);

-- Create LUTs table
CREATE TABLE IF NOT EXISTS public.luts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    file_url text,
    cube_data text,
    preview_image_url text,
    adjustments jsonb DEFAULT '{}'::jsonb,
    is_public boolean DEFAULT false,
    is_preset boolean DEFAULT false,
    download_count integer DEFAULT 0,
    tags text[]
);

-- Create project_shares table for sharing projects
CREATE TABLE IF NOT EXISTS public.project_shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
    shared_by uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    shared_with uuid REFERENCES auth.users ON DELETE CASCADE,
    share_token text UNIQUE,
    expires_at timestamp with time zone,
    permissions jsonb DEFAULT '{"view": true, "download": false, "edit": false}'::jsonb
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('images', 'images', true),
    ('videos', 'videos', true),
    ('luts', 'luts', true),
    ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_editing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for user_editing_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_editing_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_editing_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_editing_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_editing_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_editing_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_editing_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for ai_interactions
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON public.ai_interactions;
CREATE POLICY "Users can view their own AI interactions" ON public.ai_interactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI interactions" ON public.ai_interactions;
CREATE POLICY "Users can insert their own AI interactions" ON public.ai_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI interactions" ON public.ai_interactions;
CREATE POLICY "Users can update their own AI interactions" ON public.ai_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for prompt_templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.prompt_templates;
CREATE POLICY "Users can view their own templates" ON public.prompt_templates
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public templates" ON public.prompt_templates;
CREATE POLICY "Users can view public templates" ON public.prompt_templates
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.prompt_templates;
CREATE POLICY "Users can insert their own templates" ON public.prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.prompt_templates;
CREATE POLICY "Users can update their own templates" ON public.prompt_templates
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.prompt_templates;
CREATE POLICY "Users can delete their own templates" ON public.prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public projects" ON public.projects;
CREATE POLICY "Users can view public projects" ON public.projects
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for LUTs
DROP POLICY IF EXISTS "Users can view their own LUTs" ON public.luts;
CREATE POLICY "Users can view their own LUTs" ON public.luts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view public LUTs" ON public.luts;
CREATE POLICY "Users can view public LUTs" ON public.luts
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view preset LUTs" ON public.luts;
CREATE POLICY "Users can view preset LUTs" ON public.luts
    FOR SELECT USING (is_preset = true);

DROP POLICY IF EXISTS "Users can insert their own LUTs" ON public.luts;
CREATE POLICY "Users can insert their own LUTs" ON public.luts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own LUTs" ON public.luts;
CREATE POLICY "Users can update their own LUTs" ON public.luts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own LUTs" ON public.luts;
CREATE POLICY "Users can delete their own LUTs" ON public.luts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for project shares
DROP POLICY IF EXISTS "Users can view shares for their projects" ON public.project_shares;
CREATE POLICY "Users can view shares for their projects" ON public.project_shares
    FOR SELECT USING (
        auth.uid() = shared_by OR 
        auth.uid() = shared_with OR
        auth.uid() IN (
            SELECT user_id FROM public.projects WHERE id = project_id
        )
    );

DROP POLICY IF EXISTS "Users can create shares for their projects" ON public.project_shares;
CREATE POLICY "Users can create shares for their projects" ON public.project_shares
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.projects WHERE id = project_id
        )
    );

DROP POLICY IF EXISTS "Users can delete their own shares" ON public.project_shares;
CREATE POLICY "Users can delete their own shares" ON public.project_shares
    FOR DELETE USING (auth.uid() = shared_by);

-- Storage policies
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
CREATE POLICY "Users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view images" ON storage.objects;
CREATE POLICY "Users can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
CREATE POLICY "Users can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view videos" ON storage.objects;
CREATE POLICY "Users can view videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Users can upload LUTs" ON storage.objects;
CREATE POLICY "Users can upload LUTs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'luts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view LUTs" ON storage.objects;
CREATE POLICY "Users can view LUTs" ON storage.objects
    FOR SELECT USING (bucket_id = 'luts');

DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
CREATE POLICY "Users can upload thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view thumbnails" ON storage.objects;
CREATE POLICY "Users can view thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.projects;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.luts;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.luts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_editing_preferences;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_editing_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.prompt_templates;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.prompt_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some preset LUTs
INSERT INTO public.luts (name, description, is_preset, is_public, adjustments, tags) VALUES
    (
        'Cinematic Gold',
        'Warm, cinematic look with golden tones perfect for dramatic scenes',
        true,
        true,
        '{"exposure": [20], "contrast": [25], "highlights": [-15], "shadows": [10], "saturation": [20], "temperature": [35], "brightness": [0], "vibrance": [0], "clarity": [0], "hue": [0]}',
        ARRAY['cinematic', 'warm', 'golden', 'dramatic']
    ),
    (
        'Cyberpunk Neon',
        'Cool, electric look with enhanced saturation and blue tones',
        true,
        true,
        '{"exposure": [0], "contrast": [30], "highlights": [-10], "shadows": [15], "saturation": [60], "temperature": [-30], "brightness": [5], "vibrance": [25], "clarity": [10], "hue": [0]}',
        ARRAY['cyberpunk', 'neon', 'cool', 'electric', 'blue']
    ),
    (
        'Vintage Film',
        'Classic film look with warm tones and increased saturation',
        true,
        true,
        '{"exposure": [10], "contrast": [20], "highlights": [-20], "shadows": [20], "saturation": [50], "temperature": [40], "brightness": [-5], "vibrance": [15], "clarity": [-5], "hue": [0]}',
        ARRAY['vintage', 'film', 'classic', 'retro', 'warm']
    ),
    (
        'Moody Blue',
        'Dark, atmospheric look with blue undertones and high contrast',
        true,
        true,
        '{"exposure": [-20], "contrast": [40], "highlights": [-25], "shadows": [25], "saturation": [15], "temperature": [-40], "brightness": [-10], "vibrance": [10], "clarity": [15], "hue": [0]}',
        ARRAY['moody', 'dark', 'blue', 'atmospheric', 'noir']
    )
ON CONFLICT DO NOTHING; 