-- Row Level Security (RLS) Policies for the users table
-- Run this in your Supabase SQL Editor to fix the "Failed to load profile" error

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optional: If you want admins to see all users (for admin dashboard)
-- First, make sure you have an admin role check function or use a different approach
-- This is a basic example - adjust based on your needs

-- Policy: Allow authenticated users to read other users (for chat/mentor features)
-- This allows students to see their mentors and vice versa
CREATE POLICY "Users can view assigned mentors/students"
ON users
FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM chats
    WHERE (chats.student_id = auth.uid() AND chats.sponsor_id = users.id)
       OR (chats.sponsor_id = auth.uid() AND chats.student_id = users.id)
  )
);

-- If the above policies already exist, you can drop and recreate them:
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- DROP POLICY IF EXISTS "Users can insert own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- DROP POLICY IF EXISTS "Users can view assigned mentors/students" ON users;

