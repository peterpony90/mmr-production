/*
  # Add profile relationships

  1. Changes
    - Add foreign key relationships between manufacturing_orders and profiles
    - Add foreign key relationships between stage_times and profiles
    - Drop duplicate foreign key constraints

  2. Security
    - No changes to RLS policies
*/

-- First, drop the duplicate foreign key constraint from stage_times
ALTER TABLE stage_times
DROP CONSTRAINT IF EXISTS stage_times_profile_id_fkey;

-- Drop the existing foreign key constraints that we'll recreate
ALTER TABLE manufacturing_orders
DROP CONSTRAINT IF EXISTS manufacturing_orders_user_id_fkey;

ALTER TABLE stage_times
DROP CONSTRAINT IF EXISTS stage_times_user_id_fkey;

-- Add the foreign key relationships with the correct constraint names
ALTER TABLE manufacturing_orders
ADD CONSTRAINT manufacturing_orders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE stage_times
ADD CONSTRAINT stage_times_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;