import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get tenant from subdomain with better error handling
const getTenantFromSubdomain = () => {
  try {
    const hostname = window.location.hostname;
    
    // For localhost, check if there's a port and handle accordingly
    if (hostname === 'localhost') {
      return 'lyja';
    }
    
    // For production domains
    const parts = hostname.split('.');
    if (parts.length === 0) {
      console.error('Invalid hostname structure');
      return 'lyja'; // Fallback to default tenant
    }
    
    return parts[0];
  } catch (error) {
    console.error('Error getting tenant from subdomain:', error);
    return 'lyja'; // Fallback to default tenant
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with retry configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-tenant-id': getTenantFromSubdomain()
    }
  },
  db: {
    schema: 'public'
  }
});