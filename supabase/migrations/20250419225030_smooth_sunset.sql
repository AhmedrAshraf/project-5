/*
  # Create default tenant

  1. Changes
    - Add default 'lyja' tenant for development environment
    
  2. Security
    - No special security considerations needed as this is handled by existing RLS policies
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
      'email', 'contact@lyjahotel.com',
      'phone', '+1234567890'
    )
  )
)
ON CONFLICT (subdomain) DO NOTHING;