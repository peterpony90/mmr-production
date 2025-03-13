/*
  # Add stages array to manufacturing orders

  1. Changes
    - Add stages array column to manufacturing_orders table
    - Set default value for existing records
    - Make column required for future entries

  2. Security
    - Maintains existing RLS policies
*/

-- Add stages array column to manufacturing_orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'manufacturing_orders' 
    AND column_name = 'stages'
  ) THEN
    ALTER TABLE manufacturing_orders 
    ADD COLUMN stages text[] NOT NULL DEFAULT ARRAY['sticker', 'cutting', 'assembly', 'packaging'];
  END IF;
END $$;