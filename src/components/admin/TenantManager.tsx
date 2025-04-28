import React from 'react';
import { Users, Building2, Globe, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  custom_domain_verified: boolean;
  created_at: string;
  settings: {
    theme: {
      primary_color: string;
      secondary_color: string;
    };
    contact_info: {
      email: string;
      phone: string;
    };
  };
  tenant_users: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  subscriptions: Array<{
    tier: string;
    status: string;
    current_period_end: string;
  }>;
}

export function TenantManager() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTenant, setNewTenant] = React.useState({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          tenant_users (
            id,
            email,
            role
          ),
          subscriptions!tenants_subscription_id_fkey (
            tier,
            status,
            current_period_end
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 font-playfair flex items-center">
          <Building2 className="w-8 h-8 mr-3 text-accent" />
          Kunden verwalten
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
        >
          Neuen Kunden anlegen
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Neuen Kunden anlegen
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  
                  // Create tenant
                  const { data: tenant, error: tenantError } = await supabase
                    .from('tenants')
                    .insert({
                      name: newTenant.name,
                      subdomain: newTenant.subdomain.toLowerCase(),
                      settings: {
                        theme: {
                          primary_color: '#b5a49b',
                          secondary_color: '#a39288',
                          font_family: 'Playfair Display'
                        },
                        contact_info: {
                          email: newTenant.email,
                          phone: newTenant.phone,
                          address: newTenant.address
                        }
                      }
                    })
                    .select()
                    .single();

                  if (tenantError) throw tenantError;
                  
                  // Create subscription
                  const { error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .insert({
                      tenant_id: tenant.id,
                      tier: 'basic',
                      status: 'active',
                      max_users: 5,
                      max_orders_per_month: 1000
                    });

                  if (subscriptionError) throw subscriptionError;
                  
                  await fetchTenants();
                  setShowAddForm(false);
                  setNewTenant({
                    name: '',
                    subdomain: '',
                    email: '',
                    phone: '',
                    address: ''
                  });
                } catch (err) {
                  console.error('Error creating tenant:', err);
                  setError('Failed to create tenant');
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="elegant-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newTenant.subdomain}
                    onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                    className="elegant-input"
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                  />
                  <span className="ml-2 text-gray-500">.lyja-resort.com</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  className="elegant-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  className="elegant-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={newTenant.address}
                  onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
                  className="elegant-input"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird erstellt...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Kundendaten...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      ) : (
        <div className="grid gap-6">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">{tenant.name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {tenant.custom_domain || `${tenant.subdomain}.lyja-resort.com`}
                      {tenant.custom_domain_verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verifiziert
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {tenant?.settings?.contact_info?.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {tenant?.settings?.contact_info?.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {tenant?.tenant_users?.length || 0} Benutzer
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Erstellt am:</span>
                    <span className="text-sm font-medium">
                      `{new Date(tenant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.subscriptions?.[0]?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tenant.subscriptions?.[0]?.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Plan:</span>
                    <span className="text-sm font-medium capitalize">
                      {tenant.subscriptions?.[0]?.tier || 'Free'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {/* TODO: Implement tenant editing */}}
                  className="px-4 py-2 text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => {/* TODO: Implement tenant login */}}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                >
                  Als Kunde einloggen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}