/*
  # Update manufacturing orders to use single assembly stage

  1. Changes
    - Update default stages array to only include 'assembly'
    - Update existing orders to use single stage
    - Simplify stage times to only track assembly stage

  2. Security
    - Maintains existing RLS policies
*/

-- Update default stages array in manufacturing_orders
ALTER TABLE manufacturing_orders 
ALTER COLUMN stages SET DEFAULT ARRAY['assembly'];

-- Update existing orders to use only assembly stage
UPDATE manufacturing_orders
SET stages = ARRAY['assembly'],
    current_stage = CASE 
      WHEN current_stage = 'summary' THEN 'summary'
      ELSE 'assembly'
    END;

-- Clean up stage times for non-assembly stages
DELETE FROM stage_times
WHERE stage != 'assembly';