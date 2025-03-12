/*
  # Add delete policies for manufacturing orders

  1. Changes
    - Add RLS policy to allow users to delete their own manufacturing orders
    - Add RLS policy to allow users to delete stage times for their orders

  2. Security
    - Users can only delete their own orders
    - Users can only delete stage times for orders they own
    - Maintains data integrity by ensuring users can't delete other users' data
*/

-- Add policy to allow users to delete their own manufacturing orders
CREATE POLICY "Users can delete own manufacturing orders"
  ON manufacturing_orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add policy to allow users to delete stage times for their orders
CREATE POLICY "Users can delete stage times for their orders"
  ON stage_times
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM manufacturing_orders
      WHERE manufacturing_orders.id = stage_times.order_id
      AND manufacturing_orders.user_id = auth.uid()
    )
  );