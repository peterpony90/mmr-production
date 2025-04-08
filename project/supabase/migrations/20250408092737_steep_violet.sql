/*
  # Add foreign key relationship for stage_times user_id

  1. Changes
    - Add foreign key constraint to link stage_times.user_id to auth.users.id
    - Add ON DELETE CASCADE to automatically remove stage times when a user is deleted

  2. Security
    - No changes to RLS policies
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'stage_times_user_id_fkey'
  ) THEN
    ALTER TABLE stage_times
    ADD CONSTRAINT stage_times_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;