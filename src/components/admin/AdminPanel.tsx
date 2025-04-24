import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, UtensilsCrossed, Eye, Copy, Edit2, CreditCard } from 'lucide-react';
import { OrderList } from './OrderList';
import { Analytics } from './Analytics';
import { MenuEditor } from './MenuEditor';
import { TenantSettings } from './TenantSettings';
import { TimeSlotEditor } from './TimeSlotEditor';
import { SubscriptionManager } from './SubscriptionManager';
import { TenantManager } from './TenantManager';
import type { Order, MenuItem } from '../../types';
import { supabase } from '../../lib/supabase';

interface AdminPanelProps {
  onViewMenu: () => void;
  onReturnToAdmin: () => void;
  onLogout: () => void;
}

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_drinks: boolean;
}

export function AdminPanel({ onViewMenu, onReturnToAdmin, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = React.useState<
    'orders' | 'menu' | 'specials' | 'analytics' | 'timeslots' | 'settings' | 'subscription' | 'tenants'
  >('tenants');
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [dailySpecials, setDailySpecials] = React.useState<DailySpecial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const menuSubscription = React.useRef<ReturnType<typeof supabase.channel>>();
  const specialsSubscription = React.useRef<ReturnType<typeof supabase.channel>>();
  const [error, setError] = React.useState<{
    message: string;
    itemId?: string;
  } | null>(null);
  const [editingSpecial, setEditingSpecial] = React.useState<string | null>(null);
  const [editSpecialForm, setEditSpecialForm] = React.useState<Partial<DailySpecial>>({});
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const PAGE_SIZE = 20;

  React.useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    fetchTimeSlots();
    fetchDailySpecials();

    menuSubscription.current = supabase
      .channel('menu-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    specialsSubscription.current = supabase
      .channel('specials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_menu_items'
        },
        () => {
          fetchDailySpecials();
        }
      )
      .subscribe();

    return () => {
      menuSubscription.current?.unsubscribe();
      specialsSubscription.current?.unsubscribe();
    };
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('start_time');

      if (error) throw error;
      
      setTimeSlots(data || []);
      setHasMore(data?.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const fetchDailySpecials = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_menu_items')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('valid_from', { ascending: false });

      if (error) throw error;
      
      setDailySpecials(data || []);
      setHasMore(data?.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching daily specials:', error);
    }
  };

  const handleAddDailySpecial = async (
    name: string,
    name_de: string,
    description: string,
    price: number,
    validFrom: string,
    validUntil: string,
    specialType: SpecialType,
    imageUrl?: string,
    highlightColor?: string,
    timeRestrictions: Record<string, boolean> | null
  ) => {
    try {
      const { error } = await supabase
        .from('daily_menu_items')
        .insert({
          name,
          name_de,
          description,
          price,
          valid_from: validFrom,
          valid_until: validUntil,
          special_type: specialType,
          image_url: imageUrl,
          highlight_color: highlightColor,
          time_restrictions: timeRestrictions
        });

      if (error) throw error;
      await fetchDailySpecials();
    } catch (error) {
      console.error('Error adding daily special:', error);
    }
  };

  const handleUpdateDailySpecial = async (id: string, updates: Partial<DailySpecial>) => {
    try {
      const { error } = await supabase
        .from('daily_menu_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchDailySpecials();
    } catch (error) {
      console.error('Error updating daily special:', error);
      alert('Fehler beim Aktualisieren des Specials. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleRemoveDailySpecial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDailySpecials();
    } catch (error) {
      console.error('Error removing daily menu item:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const transformedOrders: Order[] = ordersData.map(order => ({
        id: order.id,
        roomNumber: order.room_number,
        firstName: order.first_name,
        lastName: order.last_name,
        phoneNumber: order.phone_number,
        location: order.location,
        status: order.status,
        total: order.total,
        timestamp: new Date(order.created_at),
        items: order.order_items.map(item => ({
          menuItem: {
            id: item.menu_items.id,
            name: item.menu_items.name,
            name_de: item.menu_items.name_de,
            description: item.menu_items.description || '',
            price: item.menu_items.price,
            category: item.menu_items.category,
            menu_category: item.menu_items.menu_category,
            available: item.menu_items.available,
            time_restrictions: item.menu_items.time_restrictions
          },
          quantity: item.quantity
        }))
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('category')
        .order('menu_category')
        .order('name_de');

      if (error) throw error;
      
      setMenuItems(data || []);
      setHasMore(data?.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: item.name,
          name_de: item.name_de,
          description: item.description,
          price: item.price,
          category: item.category,
          menu_category: item.menu_category,
          available: item.available,
          time_restrictions: item.time_restrictions,
        })
        .eq('id', item.id);

      if (error) throw error;
      await fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([item]);

      if (error) throw error;
      await fetchMenuItems();
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleRemoveMenuItem = async (id: string) => {
    try {
      setError(null);
      
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('menu_item_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (orderItems && orderItems.length > 0) {
        setError({
          message: 'Dieser Artikel kann nicht gelöscht werden, da er in bestehenden Bestellungen verwendet wird.',
          itemId: id
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchMenuItems();
    } catch (error) {
      console.error('Error removing menu item:', error);
      setError({
        message: 'Fehler beim Löschen des Artikels. Bitte versuchen Sie es später erneut.',
        itemId: id
      });
    }
  };

  const handleCopySpecial = async (special: DailySpecial) => {
    try {
      const { error } = await supabase
        .from('daily_menu_items')
        .insert({
          ...special,
          id: undefined,
          name: `${special.name} (Kopie)`,
          name_de: `${special.name_de} (Kopie)`,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;
      await fetchDailySpecials();
    } catch (error) {
      console.error('Error copying special:', error);
      alert('Fehler beim Kopieren des Specials. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleScroll = React.useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop
      === document.documentElement.offsetHeight) {
      if (hasMore) {
        setPage(p => p + 1);
      }
    }
  }, [hasMore]);

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  React.useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    fetchTimeSlots();
    fetchDailySpecials();
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              LYJA Resort Administration
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewMenu()}
                className="p-2 sm:px-4 sm:py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span className="hidden sm:inline">Zur Karte</span>
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2 bg-accent/10 text-accent rounded-lg font-medium flex items-center gap-2 hover:bg-accent/20 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Abonnement verwalten
              </button>
              <button
                onClick={onLogout}
                className="p-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2">
            {['tenants', 'orders', 'menu', 'specials', 'analytics', 'timeslots', 'settings', 'subscription'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${
                  activeTab === tab
                    ? 'bg-accent text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'orders' && 'Bestellungen'}
                {tab === 'menu' && 'Speisekarte'}
                {tab === 'specials' && 'Tagesangebote'}
                {tab === 'analytics' && 'Analyse'}
                {tab === 'timeslots' && 'Öffnungszeiten'}
                {tab === 'settings' && 'Einstellungen'}
                {tab === 'subscription' && 'Abonnement'}
                {tab === 'tenants' && 'Kunden'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24">
        {activeTab === 'orders' && (
          <OrderList
            orders={orders}
            loading={loading}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'menu' && (
          <MenuEditor
            items={menuItems}
            onUpdateItem={handleUpdateMenuItem}
            onAddItem={handleAddMenuItem}
            onRemoveItem={handleRemoveMenuItem}
          />
        )}
        
        {activeTab === 'analytics' && (
          <Analytics />
        )}
        
        {activeTab === 'timeslots' && (
          <TimeSlotEditor />
        )}
        
        {activeTab === 'settings' && (
          <TenantSettings />
        )}
        
        {activeTab === 'subscription' && (
          <SubscriptionManager />
        )}
        
        {activeTab === 'tenants' && (
          <TenantManager />
        )}

        {activeTab === 'specials' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-playfair">
              Tagesspecials verwalten
            </h2>
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <span className="inline-block w-1 h-6 bg-accent rounded mr-3"></span>
                Neues Special erstellen
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                    const name_de = (form.elements.namedItem('name_de') as HTMLInputElement).value;
                    const description = (form.elements.namedItem('description') as HTMLInputElement).value;
                    const price = parseFloat((form.elements.namedItem('price') as HTMLInputElement).value);
                    const validFrom = (form.elements.namedItem('validFrom') as HTMLInputElement).value;
                    const validUntil = (form.elements.namedItem('validUntil') as HTMLInputElement).value;
                    
                    const specialType = (form.elements.namedItem('specialType') as HTMLSelectElement).value as SpecialType;
                    const imageUrl = (form.elements.namedItem('imageUrl') as HTMLInputElement).value;
                    const highlightColor = (form.elements.namedItem('highlightColor') as HTMLInputElement).value;
                    
                    const timeRestrictions: Record<string, boolean> = {};
                    timeSlots.forEach(slot => {
                      const isChecked = (form.elements.namedItem(`timeSlot_${slot.id}`) as HTMLInputElement)?.checked || false;
                      if (isChecked) {
                        timeRestrictions[slot.id] = true;
                      }
                    });
                    
                    if (new Date(validFrom) >= new Date(validUntil)) {
                      alert('Das Enddatum muss nach dem Startdatum liegen.');
                      return;
                    }
                    
                    handleAddDailySpecial(
                      name,
                      name_de,
                      description,
                      price,
                      validFrom,
                      validUntil,
                      specialType,
                      imageUrl || undefined,
                      highlightColor || undefined,
                      Object.keys(timeRestrictions).length > 0 ? timeRestrictions : null
                    );
                    form.reset();
                  } catch (error) {
                    console.error('Error adding daily menu item:', error);
                    alert('Fehler beim Hinzufügen des Tagesgerichts. Bitte überprüfen Sie Ihre Eingaben.');
                  }
                }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              > 
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name (DE)
                  </label>
                  <input
                    type="text"
                    name="name_de"
                    required
                    className="elegant-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="elegant-input"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Art des Specials
                  </label>
                  <select
                    name="specialType"
                    className="elegant-input"
                    required
                  >
                    <option value="food">Speisen</option>
                    <option value="drinks">Getränke</option>
                    <option value="spa">Spa & Wellness</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bild-URL (optional)
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    className="elegant-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highlight-Farbe (optional)
                  </label>
                  <input
                    type="text"
                    name="highlightColor"
                    className="elegant-input"
                    placeholder="#b5a49b"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    name="description"
                    className="elegant-input"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis (€)
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    className="elegant-input"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Gültig von
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    required
                    className="elegant-input"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Gültig bis
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    required
                    className="elegant-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verfügbarkeit in Zeitfenstern
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name={`timeSlot_${slot.id}`}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {slot.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                            {slot.is_drinks && (
                              <div className="text-xs text-blue-600 mt-1">
                                Auch für Getränke verfügbar
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full btn-primary text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Special erstellen
                  </button>
                </div>
              </form>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="inline-block w-1 h-6 bg-accent rounded mr-3"></span>
                Aktuelle Specials
              </h3>
              {dailySpecials.map((item) => (
                <div 
                  key={item.id}
                  className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 ${
                    new Date() > new Date(item.valid_until) ? 'opacity-50' : ''
                  } relative`}
                >
                  {editingSpecial === item.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateDailySpecial(item.id, editSpecialForm);
                        setEditingSpecial(null);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name (DE)
                          </label>
                          <input
                            type="text"
                            value={editSpecialForm.name_de || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, name_de: e.target.value })}
                            className="elegant-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name (EN)
                          </label>
                          <input
                            type="text"
                            value={editSpecialForm.name || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, name: e.target.value })}
                            className="elegant-input"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Beschreibung
                          </label>
                          <input
                            type="text"
                            value={editSpecialForm.description || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, description: e.target.value })}
                            className="elegant-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preis (€)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editSpecialForm.price || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, price: parseFloat(e.target.value) })}
                            className="elegant-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Art des Specials
                          </label>
                          <select
                            value={editSpecialForm.special_type || 'food'}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, special_type: e.target.value as SpecialType })}
                            className="elegant-input"
                            required
                          >
                            <option value="food">Speisen</option>
                            <option value="drinks">Getränke</option>
                            <option value="spa">Spa & Wellness</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gültig von
                          </label>
                          <input
                            type="date"
                            value={editSpecialForm.valid_from?.split('T')[0] || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, valid_from: new Date(e.target.value).toISOString() })}
                            className="elegant-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gültig bis
                          </label>
                          <input
                            type="date"
                            value={editSpecialForm.valid_until?.split('T')[0] || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, valid_until: new Date(e.target.value).toISOString() })}
                            className="elegant-input"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bild-URL
                          </label>
                          <input
                            type="url"
                            value={editSpecialForm.image_url || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, image_url: e.target.value })}
                            className="elegant-input"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Highlight-Farbe
                          </label>
                          <input
                            type="text"
                            value={editSpecialForm.highlight_color || ''}
                            onChange={(e) => setEditSpecialForm({ ...editSpecialForm, highlight_color: e.target.value })}
                            className="elegant-input"
                            placeholder="#b5a49b"
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSpecial(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Abbrechen
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                            >
                              Speichern
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {item.name_de}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.special_type === 'food' && 'Speisen'}
                              {item.special_type === 'drinks' && 'Getränke'}
                              {item.special_type === 'spa' && 'Spa & Wellness'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.price)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Gültig: {new Date(item.valid_from).toLocaleDateString()} - {new Date(item.valid_until).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSpecial(item.id);
                              setEditSpecialForm(item);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCopySpecial(item)}
                            className="p-2 text-gray-400 hover:text-gray-500"
                            title="Kopieren"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Möchten Sie dieses Special wirklich löschen?')) {
                                handleRemoveDailySpecial(item.id);
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-500"
                            title="Löschen"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {item.image_url && (
                        <div className="mt-4">
                          <img
                            src={item.image_url}
                            alt={item.name_de}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}