/*
  # Add profile relationships

  1. Changes
    - Add foreign key relationship between manufacturing_orders.user_id and profiles.id
    - Add foreign key relationship between stage_times.user_id and profiles.id

  2. Security
    - No changes to RLS policies
*/

-- Add foreign key relationship for manufacturing_orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'manufacturing_orders_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key relationship for stage_times
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'stage_times_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE stage_times
    ADD CONSTRAINT stage_times_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;