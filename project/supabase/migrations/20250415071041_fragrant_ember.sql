/*
  # Add completed_at timestamp to manufacturing orders

  1. Changes
    - Add completed_at column to manufacturing_orders table
    - This column will store when an order was completed (moved to summary stage)

  2. Security
    - No changes to RLS policies
*/

-- Add completed_at column to manufacturing_orders table
ALTER TABLE manufacturing_orders
ADD COLUMN IF NOT EXISTS completed_at timestamptz;