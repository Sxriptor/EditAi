-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROJECTS & MEDIA
-- ============================================================================

-- Create projects table for user's color grading projects
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT,
    thumbnail_url TEXT,
    original_media_url TEXT,
    processed_media_url TEXT,
    media_size BIGINT,
    media_duration INTEGER, -- in seconds for videos
    media_dimensions JSONB, -- {width: number, height: number}
    prompt TEXT,
    color_adjustments JSONB DEFAULT '{}',
    lut_preset TEXT,
    lut_strength INTEGER DEFAULT 75,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    is_starred BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public projects" ON public.projects
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- LUT PRESETS & COMMUNITY
-- ============================================================================

-- Create LUT presets table
CREATE TABLE public.lut_presets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    color_adjustments JSONB NOT NULL,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on lut_presets
ALTER TABLE public.lut_presets ENABLE ROW LEVEL SECURITY;

-- LUT presets policies
CREATE POLICY "Anyone can view default presets" ON public.lut_presets
    FOR SELECT USING (is_default = TRUE);

CREATE POLICY "Pro users can view premium presets" ON public.lut_presets
    FOR SELECT USING (
        is_premium = FALSE OR 
        (auth.uid() IN (SELECT id FROM public.profiles WHERE subscription_tier IN ('pro', 'enterprise')))
    );

CREATE POLICY "Users can create custom presets" ON public.lut_presets
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND 
        is_default = FALSE
    );

CREATE POLICY "Users can update their own presets" ON public.lut_presets
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own presets" ON public.lut_presets
    FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- USER PREFERENCES & SETTINGS
-- ============================================================================

-- Create user preferences table
CREATE TABLE public.user_preferences (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    auto_save BOOLEAN DEFAULT TRUE,
    default_export_format TEXT DEFAULT 'jpg' CHECK (default_export_format IN ('jpg', 'png', 'webp', 'mp4', 'mov')),
    default_export_quality INTEGER DEFAULT 90 CHECK (default_export_quality BETWEEN 1 AND 100),
    show_help_hints BOOLEAN DEFAULT TRUE,
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
    privacy_settings JSONB DEFAULT '{"profile_public": false, "projects_public": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROJECT HISTORY & VERSIONS
-- ============================================================================

-- Create project history table for version control
CREATE TABLE public.project_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    version_name TEXT,
    prompt TEXT,
    color_adjustments JSONB,
    lut_preset TEXT,
    lut_strength INTEGER,
    processed_media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on project_history
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- Project history policies
CREATE POLICY "Users can view their own project history" ON public.project_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project history" ON public.project_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project history" ON public.project_history
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COMMUNITY FEATURES
-- ============================================================================

-- Create likes table for community interactions
CREATE TABLE public.project_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Enable RLS on project_likes
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

-- Project likes policies
CREATE POLICY "Anyone can view likes on public projects" ON public.project_likes
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE is_public = TRUE)
    );

CREATE POLICY "Users can like public projects" ON public.project_likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        project_id IN (SELECT id FROM public.projects WHERE is_public = TRUE)
    );

CREATE POLICY "Users can unlike projects they liked" ON public.project_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'preferred_username', NEW.raw_user_meta_data->>'user_name', NEW.email), ' ', '_'))
    );
    
    INSERT INTO public.user_preferences (id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_lut_presets_updated_at
    BEFORE UPDATE ON public.lut_presets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_is_public ON public.projects(is_public);
CREATE INDEX idx_projects_is_starred ON public.projects(is_starred);
CREATE INDEX idx_projects_media_type ON public.projects(media_type);
CREATE INDEX idx_projects_processing_status ON public.projects(processing_status);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);

-- Project history indexes
CREATE INDEX idx_project_history_project_id ON public.project_history(project_id);
CREATE INDEX idx_project_history_user_id ON public.project_history(user_id);
CREATE INDEX idx_project_history_created_at ON public.project_history(created_at DESC);

-- LUT presets indexes
CREATE INDEX idx_lut_presets_category ON public.lut_presets(category);
CREATE INDEX idx_lut_presets_is_default ON public.lut_presets(is_default);
CREATE INDEX idx_lut_presets_is_premium ON public.lut_presets(is_premium);
CREATE INDEX idx_lut_presets_created_by ON public.lut_presets(created_by);

-- Project likes indexes
CREATE INDEX idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON public.project_likes(user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default LUT presets
INSERT INTO public.lut_presets (name, description, category, color_adjustments, is_default, is_premium) VALUES
('Cinematic Gold', 'Warm golden tones perfect for cinematic looks', 'cinematic', 
 '{"exposure": 5, "contrast": 20, "highlights": -10, "shadows": 15, "saturation": 25, "temperature": 15, "brightness": 8, "vibrance": 12, "clarity": 5, "hue": 2}', 
 true, false),

('Cyberpunk Neon', 'High contrast with purple and cyan highlights', 'futuristic', 
 '{"exposure": 0, "contrast": 35, "highlights": -20, "shadows": 25, "saturation": 40, "temperature": -10, "brightness": 5, "vibrance": 30, "clarity": 15, "hue": -8}', 
 true, false),

('Vintage Film', 'Classic film grain aesthetic with warm undertones', 'vintage', 
 '{"exposure": -2, "contrast": 15, "highlights": -15, "shadows": 20, "saturation": -10, "temperature": 8, "brightness": 3, "vibrance": 5, "clarity": -5, "hue": 3}', 
 true, false),

('Moody Blue', 'Cool blue tones for dramatic portraits', 'portrait', 
 '{"exposure": -5, "contrast": 25, "highlights": -25, "shadows": 30, "saturation": 15, "temperature": -15, "brightness": -3, "vibrance": 8, "clarity": 10, "hue": -5}', 
 true, false),

('Natural Enhancement', 'Subtle improvements maintaining natural colors', 'natural', 
 '{"exposure": 3, "contrast": 10, "highlights": -8, "shadows": 12, "saturation": 8, "temperature": 2, "brightness": 2, "vibrance": 5, "clarity": 3, "hue": 0}', 
 true, false),

('High Fashion', 'Clean, high-contrast look for fashion photography', 'fashion', 
 '{"exposure": 8, "contrast": 30, "highlights": -18, "shadows": 5, "saturation": 20, "temperature": 5, "brightness": 5, "vibrance": 15, "clarity": 20, "hue": 0}', 
 true, true),

('Film Noir', 'Classic black and white with high contrast', 'black-white', 
 '{"exposure": 0, "contrast": 45, "highlights": -30, "shadows": 35, "saturation": -100, "temperature": 0, "brightness": 0, "vibrance": 0, "clarity": 25, "hue": 0}', 
 true, true),

('Sunset Magic', 'Warm orange and pink sunset tones', 'landscape', 
 '{"exposure": 10, "contrast": 20, "highlights": -5, "shadows": 20, "saturation": 30, "temperature": 20, "brightness": 8, "vibrance": 25, "clarity": 8, "hue": 5}', 
 true, true);

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Create storage bucket for user uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user uploads
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view public project files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-uploads' AND
        (storage.foldername(name))[2] = 'public'
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if user has reached usage limit
CREATE OR REPLACE FUNCTION public.check_usage_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile public.profiles%ROWTYPE;
BEGIN
    SELECT * INTO user_profile FROM public.profiles WHERE id = user_id;
    
    IF user_profile.subscription_tier = 'free' THEN
        RETURN user_profile.usage_count < user_profile.usage_limit;
    ELSE
        RETURN TRUE; -- Pro and enterprise users have unlimited usage
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles 
    SET usage_count = usage_count + 1 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View for public project feed
CREATE VIEW public.public_projects_feed AS
SELECT 
    p.*,
    pr.full_name as author_name,
    pr.username as author_username,
    pr.avatar_url as author_avatar,
    COALESCE(like_counts.like_count, 0) as like_count,
    CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as is_liked_by_user
FROM public.projects p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN (
    SELECT project_id, COUNT(*) as like_count
    FROM public.project_likes
    GROUP BY project_id
) like_counts ON p.id = like_counts.project_id
LEFT JOIN public.project_likes user_likes ON p.id = user_likes.project_id AND user_likes.user_id = auth.uid()
WHERE p.is_public = true
ORDER BY p.created_at DESC;

-- Enable RLS on the view
ALTER VIEW public.public_projects_feed SET (security_invoker = true);

-- ============================================================================
-- FINAL SETUP
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 