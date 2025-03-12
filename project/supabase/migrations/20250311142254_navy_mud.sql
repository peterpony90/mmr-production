/*
  # Add RLS policies for manufacturing orders and stage times

  1. Security Changes
    - Enable RLS on manufacturing_orders table (if not already enabled)
    - Enable RLS on stage_times table (if not already enabled)
    - Add policies for manufacturing_orders (if they don't exist):
      - Insert: Users can create orders (authenticated only)
      - Select: Users can read their own orders
      - Update: Users can update their own orders
    - Add policies for stage_times (if they don't exist):
      - Insert: Users can create stage times for their orders
      - Select: Users can read stage times for their orders
*/

-- Enable RLS for both tables if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'manufacturing_orders' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'stage_times' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE stage_times ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for manufacturing_orders if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'manufacturing_orders' 
    AND policyname = 'Users can create manufacturing orders'
  ) THEN
    CREATE POLICY "Users can create manufacturing orders"
      ON manufacturing_orders
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'manufacturing_orders' 
    AND policyname = 'Users can read own manufacturing orders'
  ) THEN
    CREATE POLICY "Users can read own manufacturing orders"
      ON manufacturing_orders
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'manufacturing_orders' 
    AND policyname = 'Users can update own manufacturing orders'
  ) THEN
    CREATE POLICY "Users can update own manufacturing orders"
      ON manufacturing_orders
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policies for stage_times if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stage_times' 
    AND policyname = 'Users can insert stage times for their orders'
  ) THEN
    CREATE POLICY "Users can insert stage times for their orders"
      ON stage_times
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM manufacturing_orders
          WHERE manufacturing_orders.id = stage_times.order_id
          AND manufacturing_orders.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stage_times' 
    AND policyname = 'Users can read stage times for their orders'
  ) THEN
    CREATE POLICY "Users can read stage times for their orders"
      ON stage_times
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM manufacturing_orders
          WHERE manufacturing_orders.id = stage_times.order_id
          AND manufacturing_orders.user_id = auth.uid()
        )
      );
  END IF;
END $$;