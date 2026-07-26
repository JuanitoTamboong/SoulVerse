-- ============================================================
-- SoulVerse Profile & Gallery Schema
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_base64 TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true) OR user_id IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = current_setting('app.user_id', true));

-- 2. GALLERY IMAGES TABLE
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  image_base64 TEXT NOT NULL,
  thumbnail_base64 TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read gallery images
CREATE POLICY "Gallery images are publicly readable"
  ON gallery_images FOR SELECT
  USING (true);

-- Allow users to insert their own gallery images
CREATE POLICY "Users can upload their own gallery images"
  ON gallery_images FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Allow users to delete their own gallery images
CREATE POLICY "Users can delete their own gallery images"
  ON gallery_images FOR DELETE
  USING (user_id = current_setting('app.user_id', true));

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_gallery_images_user_id ON gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);

