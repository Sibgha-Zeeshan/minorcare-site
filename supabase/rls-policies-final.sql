-- Final RLS Policies for users table
-- Allows: 1) Users see their own row, 2) Admins see ALL rows

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 1: Using Database Role (RECOMMENDED)
-- ============================================
-- ✅ Works immediately after role update (no re-login needed)
-- ✅ Single source of truth (database)
-- ✅ More reliable

CREATE POLICY "Users can view own profile or admins view all"
ON "public"."users"
FOR SELECT
USING (
  -- Regular users: Can only see their own row
  auth.uid() = id
  OR
  -- Admins: Can see ALL rows (checks database role)
  EXISTS (
    SELECT 1 FROM "public"."users" AS u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- ============================================
-- OPTION 2: Using JWT Role Claim
-- ============================================
-- ⚠️ WARNING: Requires user to re-login after role changes
-- 
-- If you prefer JWT-based check, use this instead:
-- 
-- DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON "public"."users";
-- 
-- CREATE POLICY "Users can view own profile or admins view all (JWT)"
-- ON "public"."users"
-- FOR SELECT
-- USING (
--   auth.uid() = id
--   OR
--   (auth.jwt() ->> 'role') = 'admin'
-- );

-- ============================================
-- Other Required Policies
-- ============================================

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON "public"."users"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "public"."users"
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

