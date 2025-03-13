/*
  # Add stages array to manufacturing orders

  1. Changes
    - Add stages array column to manufacturing_orders table
    - Update existing records to include all stages
    - Make stages column required for future entries

  2. Security
    - Maintains existing RLS policies
*/

-- Add stages array column to manufacturing_orders table
ALTER TABLE manufacturing_orders 
ADD COLUMN IF NOT EXISTS stages text[] NOT NULL DEFAULT ARRAY['sticker', 'cutting', 'assembly', 'packaging'];