/*
  # Create manufacturing orders tables

  1. New Tables
    - `manufacturing_orders`
      - `id` (uuid, primary key)
      - `manufacturing_number` (text, unique)
      - `bicycle_model` (text)
      - `current_stage` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)
    - `stage_times`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to manufacturing_orders)
      - `stage` (text)
      - `time_ms` (bigint)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturing_number text UNIQUE NOT NULL,
  bicycle_model text NOT NULL,
  current_stage text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES manufacturing_orders(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL,
  time_ms bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own manufacturing orders"
  ON manufacturing_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manufacturing orders"
  ON manufacturing_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manufacturing orders"
  ON manufacturing_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read stage times for their orders"
  ON stage_times
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM manufacturing_orders
    WHERE manufacturing_orders.id = stage_times.order_id
    AND manufacturing_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert stage times for their orders"
  ON stage_times
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM manufacturing_orders
    WHERE manufacturing_orders.id = stage_times.order_id
    AND manufacturing_orders.user_id = auth.uid()
  ));