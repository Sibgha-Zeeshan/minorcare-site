-- RLS Policies using JWT role claim
-- ⚠️ WARNING: JWT roles don't update automatically when you change database role
-- Users must sign out and sign back in after role changes

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY: Users can view own profile OR admins can view all (using JWT)
-- ============================================
CREATE POLICY "Users can view own profile or admins view all"
ON "public"."users"
FOR SELECT
USING (
  -- User viewing their own profile
  auth.uid() = id
  OR
  -- Admin viewing any profile (checks JWT claim)
  (auth.jwt() ->> 'role') = 'admin'
);

-- ============================================
-- IMPORTANT: Setting role in JWT during signup
-- ============================================
-- For this to work, you MUST set the role in JWT metadata during signup:
-- 
-- supabase.auth.signUp({
--   email: 'user@example.com',
--   password: 'password',
--   options: {
--     data: {
--       role: 'admin'  // This goes into JWT metadata
--     }
--   }
-- })
--
-- ⚠️ LIMITATION: If you later update the role in database:
--    UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
--    The JWT will STILL have the old role until user re-logins!

-- ============================================
-- POLICY: Users can insert their own profile
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

