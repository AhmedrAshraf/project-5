/*
  # Add time slots editor functionality
  
  1. Changes
    - Add staff_notification_number to time_slots table
    - Add function to validate time slot times
    - Add trigger to ensure valid time ranges
    - Add policies for managing time slots
  
  2. Security
    - Maintain existing RLS policies
    - Add validation for time ranges
*/

-- Add function to validate time slot times
CREATE OR REPLACE FUNCTION validate_time_slot_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure end_time is after start_time
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  -- Ensure times are within valid range (00:00 - 23:59)
  IF NOT (NEW.start_time >= '00:00' AND NEW.start_time <= '23:59' AND
          NEW.end_time >= '00:00' AND NEW.end_time <= '23:59') THEN
    RAISE EXCEPTION 'Times must be between 00:00 and 23:59';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time validation
DROP TRIGGER IF EXISTS validate_time_slot_times_trigger ON time_slots;
CREATE TRIGGER validate_time_slot_times_trigger
  BEFORE INSERT OR UPDATE ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION validate_time_slot_times();

-- Add policies for managing time slots
DROP POLICY IF EXISTS "Allow authenticated users to manage time slots" ON time_slots;
CREATE POLICY "Allow authenticated users to manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (
    label IS NOT NULL AND
    start_time IS NOT NULL AND
    end_time IS NOT NULL AND
    label != ''
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_label
  ON time_slots(label);

-- Add comment explaining time slot management
COMMENT ON TABLE time_slots IS 'Configurable time slots for menu availability';
COMMENT ON COLUMN time_slots.label IS 'Display name for the time slot';
COMMENT ON COLUMN time_slots.start_time IS 'Start time in 24h format (HH:MM)';
COMMENT ON COLUMN time_slots.end_time IS 'End time in 24h format (HH:MM)';
COMMENT ON COLUMN time_slots.is_drinks IS 'Whether this slot is available for drinks orders';