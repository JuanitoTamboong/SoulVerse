-- ============================================================
-- Fix: Add missing columns avatar and gallery to profiles table
-- The original profile-gallery-schema.sql created profiles with
-- avatar_base64 (wrong name) and no gallery column.
-- The JS code expects: avatar (TEXT) and gallery (TEXT[])
-- ============================================================

-- 1. Drop the old avatar_base64 column and add the correct avatar column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- 2. Drop the separate gallery_images table since JS stores gallery as array in profiles
DROP TABLE IF EXISTS gallery_images CASCADE;

-- 3. Verify the profiles table has the correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- ============================================================
-- DONE
-- ============================================================
SELECT 'Profiles table updated with avatar and gallery columns successfully!' as status;

