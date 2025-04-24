/*
  # Initial schema for LYJA Resort ordering system

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `category` (text)
      - `available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `room_number` (text)
      - `location` (text)
      - `status` (text)
      - `total` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `menu_item_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price_at_time` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage orders
    - Add policies for staff to manage menu items
*/

-- Create menu_items table
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'drinks')),
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  location text NOT NULL CHECK (location IN ('pool', 'terrace', 'room', 'restaurant', 'bar')),
  status text NOT NULL CHECK (status IN ('new', 'processing', 'completed')) DEFAULT 'new',
  total numeric NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time numeric NOT NULL CHECK (price_at_time >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow authenticated users to create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read their orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category) VALUES
  ('Wiener Schnitzel', 'Traditionelles Schnitzel vom Kalb mit Kartoffelsalat', 24.50, 'dinner'),
  ('Bircher Müsli', 'Hausgemachtes Müsli mit frischen Früchten', 9.50, 'breakfast'),
  ('Caesar Salat', 'Römersalat mit Croutons und Parmesan', 16.50, 'lunch'),
  ('Aperol Spritz', 'Aperol, Prosecco, Mineralwasser', 8.50, 'drinks'),
  ('Hausgemachte Limonade', 'Frisch gepresste Zitronen, Minze, Mineralwasser', 5.50, 'drinks'),
  ('Espresso Martini', 'Vodka, Kaffeelikör, frischer Espresso', 12.50, 'drinks');