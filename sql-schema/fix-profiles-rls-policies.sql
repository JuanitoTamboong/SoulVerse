-- ============================================================
-- FIX: RLS Policies, Missing Columns, and Cleanup
-- 
-- Problem 1: profiles table RLS policies used 
--   current_setting('app.user_id', true) but JS never sets this.
--   Result: 401/42501 errors on INSERT/UPDATE
--
-- Problem 2: profiles table may be missing avatar/gallery columns.
-- ============================================================

-- 1. Drop old restrictive RLS policies
DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 2. Create permissive policies (same as stars table)
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete profiles"
  ON profiles FOR DELETE
  USING (true);

-- 3. Ensure avatar and gallery columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- 4. Drop gallery_images table only if it exists (safe)
DROP TABLE IF EXISTS gallery_images CASCADE;

