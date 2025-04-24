/*
  # Add subscription management features
  
  1. New Tables
    - `subscription_features`
      - Tracks available features per subscription tier
    - `subscription_usage`
      - Tracks usage metrics for billing
    
  2. Changes
    - Add billing contact info to subscriptions
    - Add usage tracking triggers
*/

-- Create subscription features table
CREATE TABLE subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  feature_key text NOT NULL,
  feature_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_tier_feature UNIQUE (tier, feature_key)
);

-- Create subscription usage table
CREATE TABLE subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  metric text NOT NULL,
  value integer NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_metric CHECK (metric IN ('orders', 'users', 'api_calls'))
);

-- Add billing contact info to subscriptions
ALTER TABLE subscriptions
ADD COLUMN billing_email text,
ADD COLUMN billing_name text,
ADD COLUMN billing_address jsonb;

-- Create function to record usage
CREATE OR REPLACE FUNCTION record_subscription_usage(
  p_subscription_id uuid,
  p_metric text,
  p_value integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO subscription_usage (subscription_id, metric, value)
  VALUES (p_subscription_id, p_metric, p_value);
END;
$$;

-- Create trigger to track order usage
CREATE OR REPLACE FUNCTION track_order_usage()
RETURNS trigger AS $$
BEGIN
  -- Get subscription ID for tenant
  WITH sub AS (
    SELECT s.id 
    FROM subscriptions s
    JOIN tenants t ON t.id = s.tenant_id
    WHERE t.id = NEW.tenant_id
    AND s.status = 'active'
    LIMIT 1
  )
  -- Record usage
  SELECT record_subscription_usage(
    (SELECT id FROM sub),
    'orders',
    1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_order_usage_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_usage();

-- Add default feature limits
INSERT INTO subscription_features (tier, feature_key, feature_value) VALUES
  ('free', 'max_orders', '100'::jsonb),
  ('free', 'max_users', '1'::jsonb),
  ('free', 'custom_domain', 'false'::jsonb),
  ('basic', 'max_orders', '1000'::jsonb),
  ('basic', 'max_users', '5'::jsonb),
  ('basic', 'custom_domain', 'true'::jsonb),
  ('premium', 'max_orders', '10000'::jsonb),
  ('premium', 'max_users', '20'::jsonb),
  ('premium', 'custom_domain', 'true'::jsonb),
  ('enterprise', 'max_orders', 'null'::jsonb),
  ('enterprise', 'max_users', 'null'::jsonb),
  ('enterprise', 'custom_domain', 'true'::jsonb);

-- Enable RLS
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow authenticated users to read subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read their subscription usage"
  ON subscription_usage
  FOR SELECT
  TO authenticated
  USING (
    subscription_id IN (
      SELECT s.id FROM subscriptions s
      JOIN tenants t ON t.id = s.tenant_id
      WHERE t.id = get_current_tenant_id()
    )
  );