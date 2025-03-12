/*
  # Add name field to profiles table

  1. Changes
    - Add name column to profiles table
    - Update existing profiles to have a default name based on email
    - Make name column required for future entries

  2. Security
    - Maintain existing RLS policies
*/

-- Add name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name text;

-- Set default names for existing profiles based on email
UPDATE profiles 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL;

-- Make name column required
ALTER TABLE profiles 
ALTER COLUMN name SET NOT NULL;