/*
  # Fix user relationships for manufacturing orders and stage times

  1. Changes
    - Drop existing foreign key constraints
    - Recreate foreign key relationships with correct references
    - Ensure all users have corresponding profiles
    - Add proper RLS policies for profile access

  2. Security
    - Maintain existing RLS policies
    - Add new policies for profile access
*/

-- First ensure all users have corresponding profiles
INSERT INTO profiles (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) as name,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Drop existing foreign key constraints
ALTER TABLE manufacturing_orders
DROP CONSTRAINT IF EXISTS manufacturing_orders_user_id_fkey;

ALTER TABLE stage_times
DROP CONSTRAINT IF EXISTS stage_times_user_id_fkey;

-- Add the foreign key relationships with the correct constraint names
ALTER TABLE manufacturing_orders
ADD CONSTRAINT manufacturing_orders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE stage_times
ADD CONSTRAINT stage_times_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add RLS policy for profiles to allow reading any profile
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);