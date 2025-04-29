import React from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState<string | null>(null);

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
      userRole,
      signIn: async (email: string, password: string) => {
        try {
          console.log('Starting sign in process...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          
          console.log('Auth user ID:', data.user?.id);
          
          // Get user role from tenant_users table
          console.log('Fetching tenant user...');
          const { data: tenantUser, error: tenantUserError } = await supabase
            .from('tenant_users')
            .select('*')
            .eq('auth_user_id', data.user?.id)
            .single();

          console.log('Tenant user query result:', { tenantUser, error: tenantUserError });

          if (tenantUserError) {
            console.error('Error fetching tenant user:', tenantUserError);
            throw tenantUserError;
          }

          if (!tenantUser) {
            console.error('No tenant user found for auth ID:', data.user?.id);
            throw new Error('No tenant user found. Please contact support.');
          }

          console.log('Found tenant user:', tenantUser);
          
          // Store user role in state
          setUserRole(tenantUser.role);
          console.log('User role set to:', tenantUser.role);
          
          // Navigate based on role
          if (tenantUser.role === 'admin' || tenantUser.role === 'owner') {
            console.log('User has admin/owner role, redirecting to admin panel');
            window.location.href = '/admin';
          } else {
            console.log('User has non-admin role, redirecting to dashboard');
            window.location.href = '/dashboard';
          }
        } catch (error) {
          console.error('Error signing in:', error);
          throw error;
        }
      },
      signUp: async (email: string, password: string) => {
        try {
          console.log('Starting signup process for email:', email);
          
          // Get the current domain for verification
          const currentDomain = window.location.origin;
          
          // 1. Create the auth user with email confirmation
          console.log('Attempting to create auth user...');
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${currentDomain}/auth/callback`,
              data: {
                email,
                full_name: email.split('@')[0],
              }
            },
          });

          console.log('Auth signup response:', { authData, authError });

          if (authError) {
            console.error('Auth signup error:', authError);
            throw authError;
          }
          if (!authData.user) {
            console.error('No user data returned from auth signup');
            throw new Error('No user data returned');
          }

          // Check if email confirmation is required
          console.log('Checking user identities:', authData.user.identities);
          if (authData.user.identities?.length === 0) {
            console.log('User already exists, redirecting to sign in');
            throw new Error('Email already registered. Please sign in instead.');
          }

          // 2. Create a tenant for the user
          console.log('Creating tenant for user:', authData.user.id);
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([
              {
                name: email.split('@')[0],
                subdomain: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
                created_by: authData.user.id,
                email: email,
                is_active: true,
              }
            ])
            .select()
            .single();

          console.log('Tenant creation response:', { tenantData, tenantError });

          if (tenantError) {
            console.error('Tenant creation error:', tenantError);
            throw tenantError;
          }

          // 3. Create tenant user relationship
          console.log('Creating tenant user relationship...');
          const { error: tenantUserError } = await supabase
            .from('tenant_users')
            .insert([
              {
                auth_user_id: authData.user.id,
                tenant_id: tenantData.id,
                role: 'owner',
                email: email,
                first_name: email.split('@')[0].split('.')[0],
                last_name: email.split('@')[0].split('.')[1] || '',
                is_active: true,
                email_verified: false,
                last_login_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                permissions: ['owner'],
                settings: {
                  notifications: true,
                  theme: 'light',
                  language: 'en'
                }
              }
            ]);

          console.log('Tenant user creation response:', { tenantUserError });

          if (tenantUserError) {
            console.error('Tenant user creation error:', tenantUserError);
            throw tenantUserError;
          }

          // 4. Create default time slots
          console.log('Creating default time slots...');
          const defaultTimeSlots = [
            {
              tenant_id: tenantData.id,
              label: 'Breakfast',
              start_time: '07:00:00',
              end_time: '11:00:00',
              is_drinks: false,
              created_by: authData.user.id,
              updated_by: authData.user.id,
            },
            {
              tenant_id: tenantData.id,
              label: 'Lunch',
              start_time: '11:00:00',
              end_time: '15:00:00',
              is_drinks: false,
              created_by: authData.user.id,
              updated_by: authData.user.id,
            },
            {
              tenant_id: tenantData.id,
              label: 'Dinner',
              start_time: '17:00:00',
              end_time: '22:00:00',
              is_drinks: false,
              created_by: authData.user.id,
              updated_by: authData.user.id,
            },
            {
              tenant_id: tenantData.id,
              label: 'Drinks',
              start_time: '11:00:00',
              end_time: '22:00:00',
              is_drinks: true,
              created_by: authData.user.id,
              updated_by: authData.user.id,
            }
          ];

          const { error: timeSlotsError } = await supabase
            .from('time_slots')
            .insert(defaultTimeSlots);

          console.log('Time slots creation response:', { timeSlotsError });

          if (timeSlotsError) {
            console.error('Time slots creation error:', timeSlotsError);
            throw timeSlotsError;
          }

          console.log('Signup process completed successfully');
          console.log('Auth user:', authData.user);
          console.log('Tenant:', tenantData);
          console.log('Email confirmation status:', authData.user?.email_confirmed_at ? 'Confirmed' : 'Pending');
          
          // Show success message about email verification
          alert('Please check your email for a verification link. You must verify your email before you can sign in.');
          
        } catch (error) {
          console.error('Error in signup process:', error);
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
    [user, loading, userRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}