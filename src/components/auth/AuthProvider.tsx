import React from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initialize the auth state
    const initializeAuth = async () => {
      try {
        // Check for an existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_OUT') {
              // Clear any stored auth data
              await supabase.auth.signOut();
              setUser(null);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setUser(session?.user ?? null);
            }
          }
        );

        setLoading(false);

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
        } catch (error) {
          console.error('Error signing in:', error);
          throw error;
        }
      },
      signUp: async (email: string, password: string) => {
        try {
          // 1. Create the auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('No user data returned');

          // 2. Create a tenant for the user
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([
              {
                name: email.split('@')[0], // Use email prefix as tenant name
                created_by: authData.user.id,
              }
            ])
            .select()
            .single();

          if (tenantError) throw tenantError;

          // 3. Create tenant user relationship
          const { error: tenantUserError } = await supabase
            .from('tenant_users')
            .insert([
              {
                auth_user_id: authData.user.id,
                tenant_id: tenantData.id,
                role: 'owner', // First user is always owner
                email: email,
              }
            ]);

          if (tenantUserError) throw tenantUserError;

          // 4. Create default time slots for the tenant
          const defaultTimeSlots = [
            {
              tenant_id: tenantData.id,
              label: 'Breakfast',
              start_time: '07:00:00',
              end_time: '11:00:00',
              is_drinks: false,
            },
            {
              tenant_id: tenantData.id,
              label: 'Lunch',
              start_time: '11:00:00',
              end_time: '15:00:00',
              is_drinks: false,
            },
            {
              tenant_id: tenantData.id,
              label: 'Dinner',
              start_time: '17:00:00',
              end_time: '22:00:00',
              is_drinks: false,
            },
            {
              tenant_id: tenantData.id,
              label: 'Drinks',
              start_time: '11:00:00',
              end_time: '22:00:00',
              is_drinks: true,
            }
          ];

          const { error: timeSlotsError } = await supabase
            .from('time_slots')
            .insert(defaultTimeSlots);

          if (timeSlotsError) throw timeSlotsError;

        } catch (error) {
          console.error('Error signing up:', error);
          throw error;
        }
      },
      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          setUser(null);
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}