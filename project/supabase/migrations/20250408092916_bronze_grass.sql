/*
  # Fix stage_times and profiles relationship

  1. Changes
    - Create missing profiles for users who have stage times
    - Add foreign key constraint between stage_times and profiles
    - Handle data consistency before adding constraints

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First, ensure all users who have stage times have corresponding profiles
INSERT INTO profiles (id, email, name, created_at, updated_at)
SELECT DISTINCT 
  st.user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) as name,
  NOW(),
  NOW()
FROM stage_times st
JOIN auth.users au ON au.id = st.user_id
LEFT JOIN profiles p ON p.id = st.user_id
WHERE p.id IS NULL;

-- Now we can safely add the foreign key constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'stage_times_profile_id_fkey'
  ) THEN
    ALTER TABLE stage_times
    ADD CONSTRAINT stage_times_profile_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;