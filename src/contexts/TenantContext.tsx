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
  tenantUser: any;
  loading: boolean;
  error: string | null;
}

export const TenantContext = React.createContext<TenantContextType>({
  tenant: null,
  tenantUser: null,
  loading: true,
  error: null 
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [tenantUser, setTenantUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const getSubdomain = () => {
    const hostname = window.location.hostname;
    
    // If we're on localhost, use 'lyja' as default
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'sulaiman-ahmedashraf';
    }
    
    // Extract subdomain from hostname
    // e.g., 'test.lyja-resort.com' -> 'test'
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    
    // If no subdomain found, use default
    return 'lyja';
  };

  React.useEffect(() => {
    const fetchTenant = async () => {
      try {
        const subdomain = getSubdomain();
        console.log('Fetching tenant for subdomain:', subdomain);
        
        // First get the tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .single();

        console.log('Tenant query result:', { tenantData, error: tenantError });

        if (tenantError) {
          console.error('Error fetching tenant:', tenantError);
          setError(tenantError.message);
          setLoading(false);
          return;
        }

        if (!tenantData) {
          console.error('No tenant found for subdomain:', subdomain);
          setError('No tenant found');
          setLoading(false);
          return;
        }

        setTenant(tenantData);
        console.log('Tenant set:', tenantData);

        // Then get the tenant user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Fetching tenant user for auth ID:', user.id);
          const { data: tenantUserData, error: tenantUserError } = await supabase
            .from('tenant_users')
            .select('*')
            .eq('auth_user_id', user.id)
            .eq('tenant_id', tenantData.id)
            .single();

          console.log('Tenant user query result:', { tenantUserData, error: tenantUserError });

          if (tenantUserError) {
            console.error('Error fetching tenant user:', tenantUserError);
            setError(tenantUserError.message);
          } else if (tenantUserData) {
            setTenantUser(tenantUserData);
            console.log('Tenant user set:', tenantUserData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in fetchTenant:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTenant();
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

  const value = React.useMemo(
    () => ({
      tenant,
      tenantUser,
      loading,
      error,
    }),
    [tenant, tenantUser, loading, error]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}