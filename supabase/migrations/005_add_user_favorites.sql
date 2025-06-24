-- Create preset_favorites table for storing user's favorite presets
CREATE TABLE public.preset_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    preset_id VARCHAR NOT NULL, -- Can be either numeric ID for built-in presets or UUID for user presets
    is_built_in BOOLEAN DEFAULT false, -- Flag to distinguish between built-in and user presets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, preset_id)
);

-- Enable RLS on preset_favorites
ALTER TABLE public.preset_favorites ENABLE ROW LEVEL SECURITY;

-- Preset favorites policies
CREATE POLICY "Users can view their own preset favorites" ON public.preset_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preset favorites" ON public.preset_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preset favorites" ON public.preset_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX preset_favorites_user_id_idx ON public.preset_favorites(user_id);
CREATE INDEX preset_favorites_preset_id_idx ON public.preset_favorites(preset_id); 