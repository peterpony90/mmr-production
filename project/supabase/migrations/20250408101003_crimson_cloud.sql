/*
  # Add profile foreign key relationships

  1. Changes
    - Add foreign key relationship between manufacturing_orders.user_id and profiles.id
    - Add foreign key relationship between stage_times.user_id and profiles.id
    - Drop existing foreign key to users table since we want to reference profiles instead

  2. Security
    - No changes to RLS policies
*/

-- Drop existing foreign key constraints that reference the users table
ALTER TABLE manufacturing_orders 
DROP CONSTRAINT IF EXISTS manufacturing_orders_user_id_fkey;

ALTER TABLE stage_times 
DROP CONSTRAINT IF EXISTS stage_times_user_id_fkey;

-- Add new foreign key constraints to reference the profiles table
ALTER TABLE manufacturing_orders
ADD CONSTRAINT manufacturing_orders_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE stage_times
ADD CONSTRAINT stage_times_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;