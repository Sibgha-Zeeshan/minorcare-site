-- Correct RLS Policies for users table
-- This allows: 1) Users to see their own row, 2) Admins to see ALL rows

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY: Users can view their own profile OR admins can view all
-- ============================================
-- This policy allows:
-- - Regular users: Can only see their own row (auth.uid() = id)
-- - Admins: Can see ALL rows (checking database role, not JWT)
CREATE POLICY "Users can view own profile or admins view all"
ON "public"."users"
FOR SELECT
USING (
  -- Option 1: User viewing their own profile
  auth.uid() = id
  OR
  -- Option 2: Admin viewing any profile (checks database role)
  EXISTS (
    SELECT 1 FROM "public"."users" AS u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- ============================================
-- ALTERNATIVE: If you want to use JWT role instead
-- ============================================
-- Note: This requires the role to be set in JWT metadata during signup
-- AND the user must re-login after role changes in database
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
-- POLICY: Users can insert their own profile (for signup)
-- ============================================
CREATE POLICY "Users can insert own profile"
ON "public"."users"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICY: Users can update their own profile
-- ============================================
CREATE POLICY "Users can update own profile"
ON "public"."users"
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- OPTIONAL: Admins can update any user
-- ============================================
-- Uncomment if you want admins to be able to update user profiles
-- CREATE POLICY "Admins can update all users"
-- ON "public"."users"
-- FOR UPDATE
-- USING (
--   EXISTS (
--     SELECT 1 FROM "public"."users" AS u
--     WHERE u.id = auth.uid()
--     AND u.role = 'admin'
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM "public"."users" AS u
--     WHERE u.id = auth.uid()
--     AND u.role = 'admin'
--   )
-- );

