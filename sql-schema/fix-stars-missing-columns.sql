-- ============================================================
-- Fix: Add missing profile columns to stars table
-- The profile-gallery-schema.sql created the profiles table
-- but forgot to add profile_pic, bio, display_name, gallery
-- columns to the existing stars table.
-- ============================================================

-- 1. Add missing columns to stars table (safe, uses IF NOT EXISTS)
ALTER TABLE stars ADD COLUMN IF NOT EXISTS profile_pic TEXT DEFAULT NULL;
ALTER TABLE stars ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE stars ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE stars ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- 2. Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stars' 
ORDER BY ordinal_position;

-- ============================================================
-- DONE
-- ============================================================
SELECT 'Stars table updated with profile columns successfully!' as status;

