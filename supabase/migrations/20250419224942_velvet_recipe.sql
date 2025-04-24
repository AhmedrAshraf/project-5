/*
  # Create default development tenant

  1. Changes
    - Add default 'lyja' tenant for development environment
    
  2. Details
    - Creates a tenant with subdomain 'lyja'
    - Sets a default name and empty settings
    - This tenant will be used in development/preview environments
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenants 
    WHERE subdomain = 'lyja'
  ) THEN
    INSERT INTO tenants (name, subdomain, settings)
    VALUES (
      'Lyja Development',  -- name
      'lyja',             -- subdomain
      '{}'::jsonb         -- default empty settings
    );
  END IF;
END $$;