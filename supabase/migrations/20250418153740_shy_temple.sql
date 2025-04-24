/*
  # Add staff notification number and update SMS sending
  
  1. Changes
    - Add staff_notification_number to time_slots table
    - Update existing time slots with default notification number
    - Add comment explaining the purpose
*/

-- Add staff_notification_number column to time_slots
ALTER TABLE time_slots
ADD COLUMN staff_notification_number text;

-- Set default notification numbers for existing slots
UPDATE time_slots
SET staff_notification_number = (
  CASE 
    WHEN label = 'Frühstück' THEN '+491234567890'
    WHEN label = 'Lunchkarte' THEN '+491234567890'
    WHEN label = 'Abendessen' THEN '+491234567890'
    WHEN label = 'Getränke' THEN '+491234567890'
    ELSE '+491234567890'
  END
);

-- Add comment explaining the column
COMMENT ON COLUMN time_slots.staff_notification_number IS 'Phone number for staff notifications during this time slot';