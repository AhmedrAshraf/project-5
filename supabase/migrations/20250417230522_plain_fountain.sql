/*
  # Add daily special fields to menu items

  1. Changes
    - Add `is_daily_special` column to menu_items table
    - Add `valid_from` and `valid_until` columns for daily special date range
*/

-- Add daily special fields to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_daily_special boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS valid_from timestamptz,
ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- Add constraint to ensure valid date range when item is a daily special
ALTER TABLE menu_items
ADD CONSTRAINT valid_daily_special_dates 
CHECK (
  (is_daily_special = false AND valid_from IS NULL AND valid_until IS NULL) OR
  (is_daily_special = true AND valid_from IS NOT NULL AND valid_until IS NOT NULL AND valid_until > valid_from)
);