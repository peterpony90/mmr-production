/*
  # Remove bicycle_model field from manufacturing orders

  1. Changes
    - Remove bicycle_model column from manufacturing_orders table
    - This field is no longer needed as per business requirements

  2. Security
    - No security changes needed
    - Maintains existing RLS policies
*/

-- Remove bicycle_model column from manufacturing_orders table
ALTER TABLE manufacturing_orders 
DROP COLUMN IF EXISTS bicycle_model;