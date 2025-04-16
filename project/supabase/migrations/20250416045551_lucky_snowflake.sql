/*
  # Add incidents and task description tracking

  1. Changes
    - Add has_incidents column to manufacturing_orders table
    - Add incident_description column to manufacturing_orders table
    - These columns will track incidents and task descriptions for both order types

  2. Security
    - Maintains existing RLS policies
*/

-- Add incidents tracking columns
ALTER TABLE manufacturing_orders
ADD COLUMN IF NOT EXISTS has_incidents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS incident_description text;