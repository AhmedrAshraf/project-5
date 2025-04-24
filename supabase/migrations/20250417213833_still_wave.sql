/*
  # Add sample daily specials

  1. Sample Data
    - Adds three sample daily specials with different time periods
    - Uses existing menu items
    - Sets promotional prices
    - Defines validity periods

  2. Notes
    - Special prices are set lower than regular menu item prices
    - Validity periods are set to ensure specials are currently active
*/

-- Insert sample daily specials
INSERT INTO daily_specials (menu_item_id, special_price, valid_from, valid_until)
SELECT 
  id as menu_item_id,
  price * 0.8 as special_price, -- 20% discount
  NOW() as valid_from,
  NOW() + INTERVAL '7 days' as valid_until
FROM menu_items 
WHERE category = 'lunch'
LIMIT 3;