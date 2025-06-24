-- Migrate favorites from user_preferences to user_favorites
DO $$
DECLARE
    r RECORD;
BEGIN
    -- First, check if the favorite_presets column exists in user_preferences
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'favorite_presets'
    ) THEN
        FOR r IN SELECT id, favorite_presets FROM user_preferences WHERE favorite_presets IS NOT NULL
        LOOP
            INSERT INTO user_favorites (user_id, preset_id)
            SELECT r.id, jsonb_array_elements_text(r.favorite_presets::jsonb)
            ON CONFLICT (user_id, preset_id) DO NOTHING;
        END LOOP;
    END IF;
END $$; 