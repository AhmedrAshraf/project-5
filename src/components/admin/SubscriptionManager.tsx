import React from 'react';
import { CreditCard, Star, Users, Package, Globe, Code, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TenantContext } from '../../contexts/TenantContext';

interface SubscriptionFeature {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  feature_key: string;
  feature_value: any;
}

export function SubscriptionManager() {
  const { tenant } = React.useContext(TenantContext);
  const [features, setFeatures] = React.useState<SubscriptionFeature[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_features')
        .select('*')
        .order('tier');

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error fetching subscription features:', err);
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: 'Free',
      tier: 'free' as const,
      price: '€0',
      description: 'Get started with basic features',
      icon: Star,
    },
    {
      name: 'Basic',
      tier: 'basic' as const,
      price: '€49',
      description: 'Perfect for small hotels',
      icon: Package,
    },
    {
      name: 'Premium',
      tier: 'premium' as const,
      price: '€99',
      description: 'Advanced features for growing businesses',
      icon: CreditCard,
    },
    {
      name: 'Enterprise',
      tier: 'enterprise' as const,
      price: 'Custom',
      description: 'Custom solutions for large organizations',
      icon: Globe,
    },
  ];

  const getFeatureValue = (tier: string, key: string) => {
    const feature = features.find(f => f.tier === tier && f.feature_key === key);
    if (!feature) return null;
    return feature.feature_value;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading subscription information...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 font-playfair flex items-center">
          <CreditCard className="w-8 h-8 mr-3 text-accent" />
          Subscription Management
        </h2>
        <div className="text-sm text-gray-600">
          Current Plan: <span className="font-medium">{tenant?.subscription?.tier || 'Free'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isCurrentTier = tenant?.subscription?.tier === tier.tier;
          
          return (
            <div
              key={tier.tier}
              className={`rounded-xl p-6 space-y-4 transition-all ${
                isCurrentTier
                  ? 'border-2 border-accent bg-accent/5 transform scale-105'
                  : 'border border-gray-200 hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-8 h-8 ${isCurrentTier ? 'text-accent' : 'text-gray-400'}`} />
                {isCurrentTier && (
                  <span className="px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
              </div>

              <div className="text-2xl font-bold text-gray-900">
                {tier.price}
                {tier.tier !== 'enterprise' && (
                  <span className="text-sm font-normal text-gray-500">/month</span>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getFeatureValue(tier.tier, 'max_users') === 'null'
                      ? 'Unlimited users'
                      : `${getFeatureValue(tier.tier, 'max_users')} users`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getFeatureValue(tier.tier, 'max_orders') === 'null'
                      ? 'Unlimited orders'
                      : `${getFeatureValue(tier.tier, 'max_orders')} orders/month`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getFeatureValue(tier.tier, 'custom_domain') ? (
                      'Custom domain'
                    ) : (
                      'No custom domain'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {getFeatureValue(tier.tier, 'api_access') ? (
                      'API access'
                    ) : (
                      'No API access'
                    )}
                  </span>
                </div>
              </div>

              <button
                className={`w-full mt-6 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isCurrentTier
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => {
                  if (tier.tier === 'enterprise') {
                    window.location.href = 'mailto:sales@lyja-resort.com?subject=Enterprise Plan Inquiry';
                  } else {
                    // Handle plan change
                    console.log('Change to:', tier.tier);
                  }
                }}
              >
                {isCurrentTier ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Current Plan
                  </span>
                ) : tier.tier === 'enterprise' ? (
                  'Contact Sales'
                ) : (
                  'Upgrade'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Monthly Orders</div>
            <div className="mt-1 flex items-end">
              <div className="text-2xl font-semibold text-gray-900">247</div>
              <div className="text-sm text-gray-500 ml-2">/ {tenant?.subscription?.max_orders_per_month || 100}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full" 
                style={{ width: `${Math.min((247 / (tenant?.subscription?.max_orders_per_month || 100)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Active Users</div>
            <div className="mt-1 flex items-end">
              <div className="text-2xl font-semibold text-gray-900">3</div>
              <div className="text-sm text-gray-500 ml-2">/ {tenant?.subscription?.max_users || 1}</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full" 
                style={{ width: `${Math.min((3 / (tenant?.subscription?.max_users || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">API Calls</div>
            <div className="mt-1 flex items-end">
              <div className="text-2xl font-semibold text-gray-900">1,234</div>
              <div className="text-sm text-gray-500 ml-2">/ ∞</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '45%' }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Storage Used</div>
            <div className="mt-1 flex items-end">
              <div className="text-2xl font-semibold text-gray-900">2.1 GB</div>
              <div className="text-sm text-gray-500 ml-2">/ 5 GB</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '42%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Email
            </label>
            <input
              type="email"
              value={tenant?.subscription?.billing_email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="billing@company.com"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Invoice
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md text-gray-500">
              {new Date(tenant?.subscription?.current_period_end || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}