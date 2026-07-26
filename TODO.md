# SoulVerse Fixes - TODO

## ✅ Completed

### Database Schema Fixes
- [x] Created `sql-schema/fix-stars-missing-columns.sql` — Adds `profile_pic`, `bio`, `display_name`, `gallery` columns to the existing `stars` table
- [x] `sql-schema/profile-gallery-schema.sql` already run to create the `profiles` table

### JavaScript Fixes (js/script.js)
- [x] `loadProfileFromSupabase` — Changed from `.single()` to `.maybeSingle()` to avoid 406 error when no profile exists
- [x] Added graceful handling of `PGRST205` (schema cache) and `PGRST116` (no rows) errors
- [x] `saveProfileToSupabase` — Added retry logic with 1s delay when schema cache is stale
- [x] `updateProfileUI` — Added inline avatar remove button, gallery delete buttons with hover/click functionality

### CSS (css/style.css)
- [x] Fixed `.profile-avatar-preview` styling (was broken with `flex-direction: column`)

## ⏳ Pending (User Action Required)

### Run the SQL fix
Copy and run the contents of `sql-schema/fix-stars-missing-columns.sql` in your Supabase SQL Editor
