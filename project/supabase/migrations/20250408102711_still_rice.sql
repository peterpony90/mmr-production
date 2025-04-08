/*
  # Fix foreign key relationships for profiles

  1. Changes
    - Remove conflicting foreign key relationships
    - Establish correct foreign key relationships between tables and profiles
  
  2. Security
    - Maintain existing RLS policies
*/

-- First, drop the conflicting foreign keys
ALTER TABLE manufacturing_orders 
DROP CONSTRAINT IF EXISTS manufacturing_orders_user_id_profiles_fkey;

ALTER TABLE stage_times 
DROP CONSTRAINT IF EXISTS stage_times_user_id_profiles_fkey;

-- Ensure the foreign keys reference the profiles table correctly
ALTER TABLE manufacturing_orders 
ADD CONSTRAINT manufacturing_orders_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE stage_times 
ADD CONSTRAINT stage_times_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;