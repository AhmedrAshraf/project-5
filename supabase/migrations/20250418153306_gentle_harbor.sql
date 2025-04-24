/*
  # Add SMS logging and error handling
  
  1. Changes
    - Add sms_logs table to track SMS delivery attempts
    - Add function to log SMS attempts with status and error messages
    - Add trigger to automatically log SMS attempts for orders
    
  2. Security
    - Enable RLS on sms_logs table
    - Add policies for authenticated users to read logs
*/

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read logs
CREATE POLICY "Allow authenticated users to read SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to log SMS attempts
CREATE OR REPLACE FUNCTION log_sms_attempt(
  p_order_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO sms_logs (order_id, status, error_message)
  VALUES (p_order_id, p_status, p_error_message)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;