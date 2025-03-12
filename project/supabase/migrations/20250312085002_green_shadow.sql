/*
  # Add user tracking to stage times

  1. Changes
    - Add nullable user_id column to stage_times table
    - Update existing records with a default user
    - Make user_id required after data migration
    - Add foreign key constraint to link stage_times with profiles

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity between stage times and user profiles
    - Handles existing records gracefully
*/

-- Add user_id column as nullable first
ALTER TABLE stage_times
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Get the first user from profiles to use as default
DO $$
DECLARE
    default_user_id uuid;
BEGIN
    SELECT id INTO default_user_id FROM profiles LIMIT 1;
    
    -- Update existing records with the default user
    UPDATE stage_times
    SET user_id = default_user_id
    WHERE user_id IS NULL;
END $$;

-- Now make the column required
ALTER TABLE stage_times
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE stage_times
ADD CONSTRAINT stage_times_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;