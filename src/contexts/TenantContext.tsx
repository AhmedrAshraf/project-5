import React from 'react';
import { supabase } from '../lib/supabase';

interface TenantTheme {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface TenantSettings {
  theme: TenantTheme;
  business_hours: {
    monday_friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  contact_info: {
    phone: string | null;
    email: string | null;
    address: string | null;
    social_media: {
      facebook: string | null;
      instagram: string | null;
      twitter: string | null;
    };
  };
  features: {
    room_service: boolean;
    pool_service: boolean;
    bar_service: boolean;
    spa_services: boolean;
    preorders: boolean;
  };
}

interface TenantSubscription {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  max_users: number;
  max_orders_per_month: number;
  custom_domain_enabled: boolean;
  white_label_enabled: boolean;
  api_access_enabled: boolean;
}

interface TenantContextType {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    settings: TenantSettings;
    subscription: TenantSubscription;
  } | null;
  loading: boolean;
  error: string | null;
}

export const TenantContext = React.createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null 
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = React.useState<TenantContextType['tenant']>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const getSubdomain = () => {
    const hostname = window.location.hostname;
    
    return 'lyja'; // Always return default tenant for now
  };

  React.useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const subdomain = getSubdomain();

        if (!subdomain) {
          setError('Invalid hostname configuration');
          return;
        }

        const { data, error: queryError } = await supabase
          .from('tenants')
          .select(`
            *,
            subscriptions!tenants_subscription_id_fkey (
              tier,
              max_users,
              max_orders_per_month,
              custom_domain_enabled,
              white_label_enabled,
              api_access_enabled
            )
          `)
          .eq('subdomain', subdomain.toLowerCase())
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        setTenant(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError('Failed to load configuration');
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();

    const interval = setInterval(fetchTenant, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Apply theme settings
  React.useEffect(() => {
    if (tenant?.settings.theme) {
      const { primary_color, secondary_color, font_family } = tenant.settings.theme;
      
      document.documentElement.style.setProperty('--color-accent', primary_color);
      document.documentElement.style.setProperty('--color-accent-dark', secondary_color);
      
      // Update favicon if provided
      if (tenant.settings.theme.favicon_url) {
        const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (favicon) {
          favicon.href = tenant.settings.theme.favicon_url;
        }
      }
    }
  }, [tenant?.settings.theme]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}