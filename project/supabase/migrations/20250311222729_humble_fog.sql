/*
  # Update manufacturing orders policies

  1. Changes
    - Update RLS policies to allow all authenticated users to:
      - View all manufacturing orders
      - Create orders (with their user_id)
      - Update orders they're working on
      - Delete all orders (shared workspace)
    
  2. Security
    - Maintain user_id tracking for audit purposes
    - Allow all authenticated users to work with all orders
*/

-- Update the select policy to allow authenticated users to see all orders
DROP POLICY IF EXISTS "Users can read own manufacturing orders" ON manufacturing_orders;
CREATE POLICY "Users can read all manufacturing orders"
  ON manufacturing_orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Update the insert policy to ensure user_id is set but allow all authenticated users
DROP POLICY IF EXISTS "Users can insert own manufacturing orders" ON manufacturing_orders;
CREATE POLICY "Users can insert manufacturing orders"
  ON manufacturing_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update the update policy to allow all authenticated users to update any order
DROP POLICY IF EXISTS "Users can update own manufacturing orders" ON manufacturing_orders;
CREATE POLICY "Users can update any manufacturing order"
  ON manufacturing_orders
  FOR UPDATE
  TO authenticated
  USING (true);

-- Update the delete policy to allow all authenticated users to delete any order
DROP POLICY IF EXISTS "Users can delete own manufacturing orders" ON manufacturing_orders;
CREATE POLICY "Users can delete any manufacturing order"
  ON manufacturing_orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Update stage times policies to allow all authenticated users to work with all records
DROP POLICY IF EXISTS "Users can read stage times for their orders" ON stage_times;
CREATE POLICY "Users can read all stage times"
  ON stage_times
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert stage times for their orders" ON stage_times;
CREATE POLICY "Users can insert stage times"
  ON stage_times
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete stage times for their orders" ON stage_times;
CREATE POLICY "Users can delete any stage times"
  ON stage_times
  FOR DELETE
  TO authenticated
  USING (true);