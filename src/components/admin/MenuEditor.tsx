import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Menu, Coffee, UtensilsCrossed, Edit2, Save, X, Clock, Plus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  name_de: string;
  description: string;
  price: number;
  category: string;
  menu_category: string;
  beverage_category: string | null;
  available: boolean;
  is_daily_special: boolean;
  time_restrictions: Record<string, boolean> | null;
  valid_from: string | null;
  valid_until: string | null;
}

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_drinks: boolean;
}

export default function MenuEditor() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const PAGE_SIZE = 20;
  const menuSubscription = React.useRef<ReturnType<typeof supabase.channel>>();
  const timeSlotsSubscription = React.useRef<ReturnType<typeof supabase.channel>>();
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    name_de: '',
    description: '',
    price: 0,
    category: 'breakfast',
    menu_category: 'mains',
    beverage_category: null,
    available: true,
    time_restrictions: {}
  });

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
    } finally {
      setLoading(false);
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
    fetchMenuItems();
    fetchTimeSlots();
  }, [page]);

  useEffect(() => {
    fetchMenuItems();
    fetchTimeSlots();

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

    timeSlotsSubscription.current = supabase
      .channel('time-slots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_slots'
        },
        () => {
          fetchTimeSlots();
        }
      )
      .subscribe();

    return () => {
      menuSubscription.current?.unsubscribe();
      timeSlotsSubscription.current?.unsubscribe();
    };
  }, []);

  async function toggleAvailability(id: string, currentAvailability: boolean) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentAvailability })
        .eq('id', id);

      if (error) throw error;
      await fetchMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item.id);
    setEditForm(item);
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: editForm.name,
          name_de: editForm.name_de,
          description: editForm.description,
          price: editForm.price,
          category: editForm.category,
          menu_category: editForm.menu_category,
          beverage_category: editForm.beverage_category,
          time_restrictions: editForm.time_restrictions
        })
        .eq('id', id);

      if (error) throw error;
      await fetchMenuItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          ...newItem,
          available: true,
          tenant_id: await supabase.auth.getSession().then(({ data }) => data.session?.user?.id)
        }]);

      if (error) throw error;
      
      await fetchMenuItems();
      setShowAddForm(false);
      setNewItem({
        name: '',
        name_de: '',
        description: '',
        price: 0,
        category: 'breakfast',
        menu_category: 'mains',
        beverage_category: null,
        available: true,
        time_restrictions: {}
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      setError('Failed to add menu item. Please try again.');
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      const menuCategoryA = a.menu_category || '';
      const menuCategoryB = b.menu_category || '';
      if (menuCategoryA !== menuCategoryB) {
        return menuCategoryA.localeCompare(menuCategoryB);
      }

      const nameDeA = a.name_de || '';
      const nameDeB = b.name_de || '';
      return nameDeA.localeCompare(nameDeB);
    });
  }, [filteredItems]);

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'drinks'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu Editor</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <button 
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Menu Item</h2>
            <form onSubmit={handleAddNewItem} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="elegant-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (DE)
                  </label>
                  <input
                    type="text"
                    value={newItem.name_de}
                    onChange={(e) => setNewItem({ ...newItem, name_de: e.target.value })}
                    className="elegant-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="elegant-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => {
                      const category = e.target.value;
                      setNewItem({
                        ...newItem,
                        category,
                        beverage_category: category === 'drinks' ? 'soft_drinks' : null
                      });
                    }}
                    className="elegant-input"
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Category
                  </label>
                  <select
                    value={newItem.menu_category}
                    onChange={(e) => setNewItem({ ...newItem, menu_category: e.target.value })}
                    className="elegant-input"
                    required
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Mains</option>
                    <option value="desserts">Desserts</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
              </div>

              {newItem.category === 'drinks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beverage Category
                  </label>
                  <select
                    value={newItem.beverage_category || ''}
                    onChange={(e) => setNewItem({ ...newItem, beverage_category: e.target.value })}
                    className="elegant-input"
                    required
                  >
                    <option value="soft_drinks">Soft Drinks</option>
                    <option value="hot_drinks">Hot Drinks</option>
                    <option value="cocktails">Cocktails</option>
                    <option value="wine">Wine</option>
                    <option value="beer">Beer</option>
                    <option value="spirits">Spirits</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  className="elegant-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map(slot => (
                    <label
                      key={slot.id}
                      className={`flex items-start p-3 rounded-lg border transition-colors cursor-pointer ${
                        newItem.time_restrictions?.[slot.id]
                          ? 'border-accent bg-accent/5'
                          : 'border-gray-200 hover:border-accent/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newItem.time_restrictions?.[slot.id] || false}
                        onChange={(e) => {
                          const newRestrictions = {
                            ...newItem.time_restrictions,
                            [slot.id]: e.target.checked
                          };
                          setNewItem({
                            ...newItem,
                            time_restrictions: newRestrictions
                          });
                        }}
                        className="mt-1 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {slot.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`w-full px-4 py-3 rounded-lg text-center transition-colors ${
              selectedCategory === category
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' && 'Alle'}
            {category === 'breakfast' && 'Frühstück'}
            {category === 'lunch' && 'Lunchkarte'} 
            {category === 'dinner' && 'Abendkarte'}
            {category === 'drinks' && 'Getränke'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {sortedItems.map(item => (
            <form
              key={item.id}
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(item.id);
              }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  {editingItem === item.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1 border rounded text-sm"
                        placeholder="English Name"
                      />
                      <input
                        type="text"
                        value={editForm.name_de || ''}
                        onChange={(e) => setEditForm({ ...editForm, name_de: e.target.value })}
                        className="w-full px-3 py-1 border rounded text-sm"
                        placeholder="German Name"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.name_de}</p>
                    </>
                  )}
                </div>
                {item.category === 'drinks' ? (
                  <Coffee className="h-6 w-6 text-gray-400" />
                ) : (
                  <UtensilsCrossed className="h-6 w-6 text-gray-400" />
                )}
              </div>

              {editingItem === item.id ? (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-1 border rounded text-sm"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="drinks">Drinks</option>
                    </select>
                  </div>
                  {editForm.category === 'drinks' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beverage Category
                      </label>
                      <select
                        value={editForm.beverage_category || ''}
                        onChange={(e) => setEditForm({ ...editForm, beverage_category: e.target.value })}
                        className="w-full px-3 py-1 border rounded text-sm"
                      >
                        <option value="soft_drinks">Soft Drinks</option>
                        <option value="hot_drinks">Hot Drinks</option>
                        <option value="cocktails">Cocktails</option>
                        <option value="wine">Wine</option>
                        <option value="beer">Beer</option>
                        <option value="spirits">Spirits</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-24 px-3 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Verfügbare Zeitfenster
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map(slot => (
                        <label
                          key={slot.id}
                          className={`flex items-start p-3 rounded-lg border transition-colors cursor-pointer ${
                            editForm.time_restrictions?.[slot.id]
                              ? 'border-accent bg-accent/5'
                              : 'border-gray-200 hover:border-accent/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editForm.time_restrictions?.[slot.id] || false}
                            onChange={(e) => {
                              const newRestrictions = {
                                ...editForm.time_restrictions,
                                [slot.id]: e.target.checked
                              };
                              setEditForm({
                                ...editForm,
                                time_restrictions: newRestrictions
                              });
                            }}
                            className="mt-1 rounded border-gray-300 text-accent focus:ring-accent"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {slot.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  {item.time_restrictions && Object.keys(item.time_restrictions).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {timeSlots
                        .filter(slot => item.time_restrictions?.[slot.id])
                        .map(slot => (
                          <span
                            key={slot.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {slot.label}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                {editingItem === item.id ? (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-lg font-semibold text-gray-900">
                      €{item.price.toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item.id, item.available)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.available
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {item.available ? 'Verfügbar' : 'Nicht verfügbar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

export { MenuEditor }