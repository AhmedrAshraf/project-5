/*
  # Add SaaS features
  
  1. New Tables
    - `subscriptions`
      - Track tenant subscription status
      - Store billing information
      - Manage subscription tiers
    
    - `users`
      - Store user information
      - Manage user roles per tenant
      
  2. Changes
    - Add subscription fields to tenants table
    - Add custom domain support
*/

-- Add subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Subscription limits
  max_users integer DEFAULT 1,
  max_orders_per_month integer DEFAULT 100,
  custom_domain_enabled boolean DEFAULT false,
  white_label_enabled boolean DEFAULT false,
  api_access_enabled boolean DEFAULT false
);

-- Create users table
CREATE TABLE tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  auth_user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  first_name text,
  last_name text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'staff')),
  CONSTRAINT unique_user_per_tenant UNIQUE (tenant_id, auth_user_id)
);

-- Add custom domain support to tenants
ALTER TABLE tenants
ADD COLUMN custom_domain text,
ADD COLUMN custom_domain_verified boolean DEFAULT false,
ADD COLUMN subscription_id uuid REFERENCES subscriptions(id);

-- Add unique constraint for custom domains
ALTER TABLE tenants
ADD CONSTRAINT unique_custom_domain UNIQUE (custom_domain);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Tenants can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant users can view their own tenant's users"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant admins can manage their own tenant's users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id() AND
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE auth_user_id = auth.uid()
      AND tenant_id = get_current_tenant_id()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Add indexes
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_auth ON tenant_users(auth_user_id);

-- Add subscription tracking function
CREATE OR REPLACE FUNCTION check_subscription_limits()
RETURNS trigger AS $$
BEGIN
  -- Check if tenant has reached their order limit
  IF TG_TABLE_NAME = 'orders' THEN
    IF EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.tenant_id = NEW.tenant_id
      AND s.status = 'active'
      AND (
        SELECT COUNT(*)
        FROM orders
        WHERE tenant_id = NEW.tenant_id
        AND created_at >= date_trunc('month', CURRENT_DATE)
      ) >= s.max_orders_per_month
    ) THEN
      RAISE EXCEPTION 'Order limit reached for current subscription tier';
    END IF;
  END IF;

  -- Check if tenant has reached their user limit
  IF TG_TABLE_NAME = 'tenant_users' THEN
    IF EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.tenant_id = NEW.tenant_id
      AND s.status = 'active'
      AND (
        SELECT COUNT(*)
        FROM tenant_users
        WHERE tenant_id = NEW.tenant_id
      ) >= s.max_users
    ) THEN
      RAISE EXCEPTION 'User limit reached for current subscription tier';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;