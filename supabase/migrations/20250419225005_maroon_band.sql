/*
  # Create default tenant

  1. Changes
    - Add default 'lyja' tenant for development environment
    
  2. Notes
    - This tenant is required for local development and testing
    - The subdomain 'lyja' is used as the default in TenantContext.tsx
*/

INSERT INTO public.tenants (name, subdomain, settings)
VALUES (
  'Lyja Hotel', 
  'lyja',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'primary_color', '#4A5568',
      'secondary_color', '#718096'
    ),
    'contact', jsonb_build_object(
      'email', 'info@lyjahotel.com',
      'phone', '+1234567890'
    )
  )
)
ON CONFLICT (subdomain) DO NOTHING;