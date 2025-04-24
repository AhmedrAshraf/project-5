/*
  # Add sample menu items and daily specials

  1. New Data
    - Adds sample menu items across different categories
    - Creates daily specials with discounted prices
    - Sets validity periods for specials

  2. Menu Items Structure
    - Breakfast items
    - Lunch items
    - Dinner items
    - Drinks
*/

-- Insert sample menu items
INSERT INTO menu_items (name, name_de, description, price, category, menu_category, available) VALUES
-- Breakfast items
('Continental Breakfast', 'Kontinentales Frühstück', 'Selection of fresh bread, croissants, jam, and butter', 12.50, 'breakfast', 'mains', true),
('Eggs Benedict', 'Eier Benedict', 'Poached eggs on English muffin with hollandaise sauce', 14.90, 'breakfast', 'mains', true),
('Fresh Fruit Platter', 'Frischer Obstteller', 'Seasonal fresh fruits', 8.50, 'breakfast', 'starters', true),

-- Lunch items
('Caesar Salad', 'Caesar Salat', 'Romaine lettuce, croutons, parmesan, and Caesar dressing', 12.90, 'lunch', 'starters', true),
('Club Sandwich', 'Club Sandwich', 'Triple-decker with chicken, bacon, lettuce, and tomato', 15.90, 'lunch', 'mains', true),
('Beef Burger', 'Rindfleisch Burger', 'Premium beef patty with cheese and fresh vegetables', 18.90, 'lunch', 'mains', true),

-- Dinner items
('Grilled Salmon', 'Gegrillter Lachs', 'Fresh salmon with seasonal vegetables', 24.90, 'dinner', 'mains', true),
('Wiener Schnitzel', 'Wiener Schnitzel', 'Traditional veal schnitzel with potato salad', 22.90, 'dinner', 'mains', true),
('Tiramisu', 'Tiramisu', 'Classic Italian dessert', 8.90, 'dinner', 'desserts', true),

-- Drinks
('Fresh Orange Juice', 'Frischer Orangensaft', 'Freshly squeezed orange juice', 4.90, 'drinks', 'beverages', true),
('Espresso', 'Espresso', 'Single shot of espresso', 2.90, 'drinks', 'beverages', true),
('Mineral Water', 'Mineralwasser', 'Sparkling or still', 3.50, 'drinks', 'beverages', true);

-- Create daily specials
INSERT INTO daily_specials (menu_item_id, special_price, valid_from, valid_until)
SELECT 
  id as menu_item_id,
  price * 0.8 as special_price, -- 20% discount
  NOW() as valid_from,
  NOW() + INTERVAL '7 days' as valid_until
FROM menu_items 
WHERE name IN ('Club Sandwich', 'Beef Burger', 'Caesar Salad');