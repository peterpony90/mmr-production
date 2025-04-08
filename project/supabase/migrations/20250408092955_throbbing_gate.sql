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
DO $$ 
DECLARE
  missing_user RECORD;
BEGIN
  FOR missing_user IN 
    SELECT DISTINCT 
      st.user_id,
      au.email
    FROM stage_times st
    JOIN auth.users au ON au.id = st.user_id
    LEFT JOIN profiles p ON p.id = st.user_id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO profiles (id, email, name, created_at, updated_at)
    VALUES (
      missing_user.user_id,
      missing_user.email,
      SPLIT_PART(missing_user.email, '@', 1),
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

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