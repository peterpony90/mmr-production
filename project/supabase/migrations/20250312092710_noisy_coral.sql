/*
  # Fix stage times user reference

  1. Changes
    - Drop existing foreign key constraint
    - Update user_id references to use auth.users instead of profiles
    - Add new foreign key constraint to auth.users

  2. Security
    - Maintain data integrity with correct foreign key relationship
    - Ensure all stage times are properly linked to users
*/

-- Drop existing foreign key constraint
ALTER TABLE stage_times
DROP CONSTRAINT IF EXISTS stage_times_user_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE stage_times
ADD CONSTRAINT stage_times_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;