/*
  # Fix stage_times and profiles relationship

  1. Changes
    - Add foreign key constraint between stage_times.user_id and profiles.id
    - This enables proper joins between stage_times and profiles tables

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Add foreign key constraint between stage_times and profiles
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