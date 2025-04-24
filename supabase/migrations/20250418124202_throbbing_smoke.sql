/*
  # Reset menu items with proper categorization while preserving order history
  
  1. Changes
    - Safely update existing menu items instead of deleting them
    - Add new menu items with proper categories
    - Preserve order history by maintaining referenced items
*/

-- First, update any menu items that are referenced in orders
UPDATE menu_items
SET available = false
WHERE id IN (SELECT DISTINCT menu_item_id FROM order_items);

-- Then safely delete unreferenced menu items
DELETE FROM menu_items
WHERE id NOT IN (SELECT DISTINCT menu_item_id FROM order_items);

-- Insert breakfast items
INSERT INTO menu_items (name, name_de, description, price, category, menu_category, available, time_restrictions) VALUES
  ('Continental Breakfast', 'Kontinentales Frühstück', 'Selection of fresh bread, croissants, jam, and butter', 18.50, 'breakfast', 'mains', true, '{"breakfast": true}'),
  ('Eggs Benedict', 'Eier Benedict', 'Poached eggs on English muffin with hollandaise sauce', 16.90, 'breakfast', 'mains', true, '{"breakfast": true}'),
  ('Avocado Toast', 'Avocado Toast', 'Sourdough bread with mashed avocado, poached egg, and cherry tomatoes', 14.90, 'breakfast', 'mains', true, '{"breakfast": true}'),
  ('Pancakes', 'Pfannkuchen', 'With maple syrup and fresh berries', 12.90, 'breakfast', 'desserts', true, '{"breakfast": true}'),
  ('Fresh Fruit Bowl', 'Frische Obstschale', 'Seasonal fruits with yogurt and honey', 9.90, 'breakfast', 'starters', true, '{"breakfast": true}');

-- Insert lunch items
INSERT INTO menu_items (name, name_de, description, price, category, menu_category, available, time_restrictions) VALUES
  ('Caesar Salad', 'Caesar Salat', 'Romaine lettuce with parmesan, croutons, and Caesar dressing', 14.90, 'lunch', 'starters', true, '{"lunch": true}'),
  ('Club Sandwich', 'Club Sandwich', 'Triple-decker with chicken, bacon, egg, lettuce, and tomato', 16.90, 'lunch', 'mains', true, '{"lunch": true}'),
  ('Beef Burger', 'Rindfleisch Burger', '200g beef patty with cheddar, lettuce, tomato, and fries', 19.90, 'lunch', 'mains', true, '{"lunch": true}'),
  ('Pasta Primavera', 'Pasta Primavera', 'Fresh pasta with seasonal vegetables in cream sauce', 16.90, 'lunch', 'mains', true, '{"lunch": true}'),
  ('Ice Cream Selection', 'Eisauswahl', 'Three scoops of artisanal ice cream', 8.90, 'lunch', 'desserts', true, '{"lunch": true}');

-- Insert dinner items
INSERT INTO menu_items (name, name_de, description, price, category, menu_category, available, time_restrictions) VALUES
  ('Beef Carpaccio', 'Rinder Carpaccio', 'Thinly sliced beef with rocket and parmesan', 18.90, 'dinner', 'starters', true, '{"dinner": true}'),
  ('Grilled Sea Bass', 'Gegrillter Wolfsbarsch', 'Whole sea bass with Mediterranean vegetables', 32.90, 'dinner', 'mains', true, '{"dinner": true}'),
  ('Ribeye Steak', 'Ribeye Steak', '300g ribeye with herb butter and grilled vegetables', 38.90, 'dinner', 'mains', true, '{"dinner": true}'),
  ('Crème Brûlée', 'Crème Brûlée', 'Classic French dessert with caramelized sugar', 10.90, 'dinner', 'desserts', true, '{"dinner": true}');

-- Insert drinks
INSERT INTO menu_items (name, name_de, description, price, category, beverage_category, menu_category, available, time_restrictions) VALUES
  -- Soft Drinks
  ('Coca Cola', 'Coca Cola', '0.33l', 4.50, 'drinks', 'soft_drinks', 'beverages', true, '{"drinks": true}'),
  ('Sprite', 'Sprite', '0.33l', 4.50, 'drinks', 'soft_drinks', 'beverages', true, '{"drinks": true}'),
  ('Orange Juice', 'Orangensaft', 'Freshly squeezed, 0.25l', 5.50, 'drinks', 'soft_drinks', 'beverages', true, '{"drinks": true}'),
  
  -- Hot Drinks
  ('Espresso', 'Espresso', 'Double shot', 3.90, 'drinks', 'hot_drinks', 'beverages', true, '{"drinks": true}'),
  ('Cappuccino', 'Cappuccino', 'With steamed milk foam', 4.50, 'drinks', 'hot_drinks', 'beverages', true, '{"drinks": true}'),
  ('Hot Chocolate', 'Heiße Schokolade', 'With whipped cream', 4.90, 'drinks', 'hot_drinks', 'beverages', true, '{"drinks": true}'),
  
  -- Cocktails
  ('Mojito', 'Mojito', 'Rum, mint, lime, sugar, soda', 12.90, 'drinks', 'cocktails', 'beverages', true, '{"drinks": true}'),
  ('Gin Tonic', 'Gin Tonic', 'Premium gin with tonic water', 11.90, 'drinks', 'cocktails', 'beverages', true, '{"drinks": true}'),
  ('Aperol Spritz', 'Aperol Spritz', 'Aperol, prosecco, soda', 10.90, 'drinks', 'cocktails', 'beverages', true, '{"drinks": true}'),
  
  -- Wine
  ('House White Wine', 'Hauswein Weiß', '0.2l', 7.90, 'drinks', 'wine', 'beverages', true, '{"drinks": true}'),
  ('House Red Wine', 'Hauswein Rot', '0.2l', 7.90, 'drinks', 'wine', 'beverages', true, '{"drinks": true}'),
  ('Prosecco', 'Prosecco', '0.1l', 6.90, 'drinks', 'wine', 'beverages', true, '{"drinks": true}'),
  
  -- Beer
  ('Draft Beer', 'Bier vom Fass', '0.5l', 5.90, 'drinks', 'beer', 'beverages', true, '{"drinks": true}'),
  ('Wheat Beer', 'Weißbier', '0.5l', 5.90, 'drinks', 'beer', 'beverages', true, '{"drinks": true}'),
  ('Non-alcoholic Beer', 'Alkoholfreies Bier', '0.5l', 5.50, 'drinks', 'beer', 'beverages', true, '{"drinks": true}'),
  
  -- Spirits
  ('Gin', 'Gin', '4cl', 8.90, 'drinks', 'spirits', 'beverages', true, '{"drinks": true}'),
  ('Vodka', 'Wodka', '4cl', 8.90, 'drinks', 'spirits', 'beverages', true, '{"drinks": true}'),
  ('Whiskey', 'Whiskey', '4cl', 9.90, 'drinks', 'spirits', 'beverages', true, '{"drinks": true}');