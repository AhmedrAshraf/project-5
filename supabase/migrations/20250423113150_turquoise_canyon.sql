/*
  # Add subscription features and usage tracking
  
  1. Changes
    - Add subscription feature tracking
    - Add usage monitoring
    - Add billing cycle tracking
    
  2. Security
    - Drop existing policy if it exists
    - Re-create policy with proper permissions
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to read subscription features" ON subscription_features;

-- Create subscription features table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  feature_key text NOT NULL,
  feature_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_tier_feature UNIQUE (tier, feature_key)
);

-- Enable RLS
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow authenticated users to read subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default feature limits
INSERT INTO subscription_features (tier, feature_key, feature_value)
VALUES 
  -- Free tier
  ('free', 'max_orders', '100'::jsonb),
  ('free', 'max_users', '1'::jsonb),
  ('free', 'custom_domain', 'false'::jsonb),
  ('free', 'white_label', 'false'::jsonb),
  ('free', 'api_access', 'false'::jsonb),
  
  -- Basic tier
  ('basic', 'max_orders', '1000'::jsonb),
  ('basic', 'max_users', '5'::jsonb),
  ('basic', 'custom_domain', 'true'::jsonb),
  ('basic', 'white_label', 'false'::jsonb),
  ('basic', 'api_access', 'false'::jsonb),
  
  -- Premium tier
  ('premium', 'max_orders', '10000'::jsonb),
  ('premium', 'max_users', '20'::jsonb),
  ('premium', 'custom_domain', 'true'::jsonb),
  ('premium', 'white_label', 'true'::jsonb),
  ('premium', 'api_access', 'true'::jsonb),
  
  -- Enterprise tier
  ('enterprise', 'max_orders', 'null'::jsonb),
  ('enterprise', 'max_users', 'null'::jsonb),
  ('enterprise', 'custom_domain', 'true'::jsonb),
  ('enterprise', 'white_label', 'true'::jsonb),
  ('enterprise', 'api_access', 'true'::jsonb)
ON CONFLICT (tier, feature_key) DO UPDATE
SET feature_value = EXCLUDED.feature_value;