import React from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TenantContext } from '../../contexts/TenantContext';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error?: string;
  setError: (error: string | undefined) => void;
}

export function AdminLogin({ onLogin, error, setError }: AdminLoginProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { tenant } = React.useContext(TenantContext);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    
    if (!email || !password) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein');
      return;
    }

    if (!tenant?.id) {
      console.error('No tenant context available');
      setError('System ist nicht verfügbar. Bitte versuchen Sie es später erneut.');
      return;
    }

    try {
      setLoading(true);
      
      // First sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Ungültige E-Mail-Adresse oder Passwort');
      }

      if (!authData.user) {
        console.error('No user data returned');
        throw new Error('Benutzer nicht gefunden');
      }

      // Check tenant user role
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('role, tenant_id')
        .eq('auth_user_id', authData.user.id)
        .eq('tenant_id', tenant.id)
        .eq('email_verified', true)
        .maybeSingle();

      if (tenantError) {
        // Log the specific database error for debugging
        console.error('Tenant user query error:', tenantError);
        throw new Error('Fehler beim Überprüfen der Benutzerrechte');
      }

      if (!tenantUser) {
        console.error('No tenant user found');
        throw new Error('Kein Zugriff auf diesen Mandanten');
      }

      if (!['admin', 'owner'].includes(tenantUser.role)) {
        console.error('User does not have admin rights');
        throw new Error('Keine Administratorrechte');
      }

      // If we get here, the user is authenticated and authorized for this specific tenant
      await onLogin(email, password);
      
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      
      // Ensure we're signed out on error
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {tenant?.name || 'Admin'} Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bitte melden Sie sich an
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Anmeldung...' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}