import React from 'react';
import { Settings, Palette, Clock, Phone, Check, CreditCard, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TenantContext } from '../../contexts/TenantContext';

export function TenantSettings() {
  const { tenant } = React.useContext(TenantContext);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [settings, setSettings] = React.useState(tenant?.settings || {
    theme: {
      primary_color: '#b5a49b',
      secondary_color: '#a39288',
      font_family: 'Playfair Display',
      logo_url: null,
      favicon_url: null
    },
    business_hours: {
      monday_friday: { open: '08:00', close: '22:00' },
      saturday: { open: '09:00', close: '22:00' },
      sunday: { open: '09:00', close: '21:00' }
    },
    contact_info: {
      phone: null,
      email: null,
      address: null,
      social_media: {
        facebook: null,
        instagram: null,
        twitter: null
      }
    },
    features: {
      room_service: true,
      pool_service: true,
      bar_service: true,
      spa_services: false,
      preorders: true
    }
  });

  React.useEffect(() => {
    if (tenant?.settings) {
      setSettings(tenant.settings);
    }
  }, [tenant?.settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('tenants')
        .update({ settings })
        .eq('id', tenant?.id);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 font-playfair flex items-center">
            <Settings className="w-8 h-8 mr-3 text-accent" />
            Einstellungen
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {tenant?.subscription?.tier === 'enterprise' ? 'Enterprise Plan' :
             tenant?.subscription?.tier === 'premium' ? 'Premium Plan' :
             tenant?.subscription?.tier === 'basic' ? 'Basic Plan' : 'Free Plan'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/admin/subscription"
            className="px-4 py-2 bg-accent/10 text-accent rounded-lg font-medium flex items-center gap-2 hover:bg-accent/20 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Abonnement verwalten
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              success
                ? 'bg-green-500 text-white'
                : 'bg-accent text-white hover:bg-accent-dark'
            }`}
          >
            {success ? (
              <>
                <Check className="w-5 h-5" />
                Gespeichert
              </>
            ) : (
              'Speichern'
            )}
          </button>
        </div>
      </div>

      {/* Subscription Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Benutzer</h3>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {tenant?.subscription?.max_users || 1}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Maximale Anzahl an Benutzern
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bestellungen</h3>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {tenant?.subscription?.max_orders_per_month || 100}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Bestellungen pro Monat
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Features</h3>
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className={`w-4 h-4 ${tenant?.subscription?.custom_domain_enabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm text-gray-600">Eigene Domain</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className={`w-4 h-4 ${tenant?.subscription?.white_label_enabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm text-gray-600">White Label</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className={`w-4 h-4 ${tenant?.subscription?.api_access_enabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm text-gray-600">API Zugriff</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 font-playfair flex items-center">
          <Settings className="w-8 h-8 mr-3 text-accent" />
          Einstellungen
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            success
              ? 'bg-green-500 text-white'
              : 'bg-accent text-white hover:bg-accent-dark'
          }`}
        >
          {success ? (
            <>
              <Check className="w-5 h-5" />
              Gespeichert
            </>
          ) : (
            'Speichern'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            Design
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primärfarbe
              </label>
              <input
                type="color"
                value={settings.theme.primary_color}
                onChange={(e) => setSettings({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    primary_color: e.target.value
                  }
                })}
                className="h-10 w-full rounded-lg border border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sekundärfarbe
              </label>
              <input
                type="color"
                value={settings.theme.secondary_color}
                onChange={(e) => setSettings({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    secondary_color: e.target.value
                  }
                })}
                className="h-10 w-full rounded-lg border border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={settings.theme.logo_url || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    logo_url: e.target.value || null
                  }
                })}
                placeholder="https://example.com/logo.png"
                className="elegant-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favicon URL
              </label>
              <input
                type="url"
                value={settings.theme.favicon_url || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  theme: {
                    ...settings.theme,
                    favicon_url: e.target.value || null
                  }
                })}
                placeholder="https://example.com/favicon.ico"
                className="elegant-input"
              />
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Öffnungszeiten
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montag - Freitag
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.monday_friday.open}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        monday_friday: {
                          ...settings.business_hours.monday_friday,
                          open: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.monday_friday.close}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        monday_friday: {
                          ...settings.business_hours.monday_friday,
                          close: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Samstag
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.saturday.open}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        saturday: {
                          ...settings.business_hours.saturday,
                          open: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.saturday.close}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        saturday: {
                          ...settings.business_hours.saturday,
                          close: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sonntag
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.sunday.open}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        sunday: {
                          ...settings.business_hours.sunday,
                          open: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
                <div>
                  <input
                    type="time"
                    value={settings.business_hours.sunday.close}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        sunday: {
                          ...settings.business_hours.sunday,
                          close: e.target.value
                        }
                      }
                    })}
                    className="elegant-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-accent" />
            Kontaktinformationen
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={settings.contact_info.phone || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    phone: e.target.value || null
                  }
                })}
                placeholder="+49 123 456789"
                className="elegant-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={settings.contact_info.email || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    email: e.target.value || null
                  }
                })}
                placeholder="info@example.com"
                className="elegant-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <textarea
                value={settings.contact_info.address || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact_info: {
                    ...settings.contact_info,
                    address: e.target.value || null
                  }
                })}
                placeholder="Straße 123&#10;12345 Stadt"
                className="elegant-input min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Funktionen
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.features.room_service}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    room_service: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-gray-700">Zimmerservice</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.features.pool_service}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    pool_service: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-gray-700">Pool-Service</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.features.bar_service}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    bar_service: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-gray-700">Bar-Service</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.features.spa_services}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    spa_services: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-gray-700">Spa-Services</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.features.preorders}
                onChange={(e) => setSettings({
                  ...settings,
                  features: {
                    ...settings.features,
                    preorders: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-gray-700">Vorbestellungen</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}