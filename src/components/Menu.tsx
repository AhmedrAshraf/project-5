import React from 'react';
import { ArrowLeft, Search, Filter, Coffee, UtensilsCrossed } from 'lucide-react';
import type { MenuItem } from '../types';
import { getCurrentMenuCategory, isCurrentlyInTimeSlot } from '../utils/time';

interface CategoryGroup {
  title: string;
  items: MenuItem[];
}

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_drinks: boolean;
}

interface MenuProps {
  category?: 'food' | 'drinks';
  onAddToCart: (item: MenuItem) => void;
  onNavigateBack?: () => void;
  items: MenuItem[];
  currentCategory?: 'breakfast' | 'lunch' | 'dinner' | null;
  timeSlots: TimeSlot[];
}

export function Menu({ category = 'food', onAddToCart, onNavigateBack, items, currentCategory, timeSlots }: MenuProps) {
  const currentMenuCategory = currentCategory || getCurrentMenuCategory();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [successItem, setSuccessItem] = React.useState<string | null>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = React.useState<string>('all');

  React.useEffect(() => {
    // Scroll to top when menu mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    if (isItemOrderable(item)) {
      onAddToCart(item);
      setSuccessItem(item.id);
      setTimeout(() => setSuccessItem(null), 2000);
    }
  };

  const filteredItems = items.filter(
    item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedMenuCategory === 'all' || 
        item.menu_category === selectedMenuCategory;

      if (category === 'drinks' && item.category === 'drinks') {
        return item.available && matchesSearch && matchesCategory &&
          (!item.time_restrictions || Object.values(item.time_restrictions).some(Boolean));
      }
      return item.available && matchesSearch && matchesCategory;
    }
  );

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CategoryGroup> = {
      ...(category === 'drinks' ? {
        soft_drinks: { title: 'Softdrinks', items: [] },
        hot_drinks: { title: 'Heiße Getränke', items: [] },
        cocktails: { title: 'Cocktails', items: [] },
        wine: { title: 'Weine', items: [] },
        beer: { title: 'Biere', items: [] },
        spirits: { title: 'Spirituosen', items: [] },
      } : {
        starters: { title: 'Vorspeisen', items: [] },
        mains: { title: 'Hauptgerichte', items: [] },
        desserts: { title: 'Nachspeisen', items: [] },
        snacks: { title: 'Snacks', items: [] },
        beverages: { title: 'Getränke', items: [] }
      }),
    };

    filteredItems.forEach(item => {
      if (category === 'drinks' && item.beverage_category && groups[item.beverage_category]) {
        groups[item.beverage_category].items.push(item);
      } else if (category !== 'drinks' && groups[item.menu_category]) {
        groups[item.menu_category].items.push(item);
      }
    });

    return Object.values(groups).filter(group => group.items.length > 0);
  }, [filteredItems]);

  const isItemOrderable = (item: MenuItem) => {
    // Check if any of the item's time restrictions match active slots
    if (!item.time_restrictions || Object.keys(item.time_restrictions).length === 0) {
      return false;
    }
    
    return Object.entries(item.time_restrictions).some(([slotId, isEnabled]) => 
      isEnabled && isCurrentlyInTimeSlot(slotId, timeSlots)
    );
  };

  return (
    <div className="space-y-6 menu-section">
      {groupedItems.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center elegant-heading">
            {group.title === 'Getränke' ? <Coffee className="w-6 h-6 mr-2" /> : <UtensilsCrossed className="w-6 h-6 mr-2" />}
            {group.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {group.items.map((item) => (
              <div 
                key={item.id}
                className="menu-item elegant-card overflow-hidden p-4 sm:p-6"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 font-playfair">
                      {item.name}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      €{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!isItemOrderable(item)}
                    className={`tap-target w-full py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      successItem === item.id
                        ? 'bg-green-600 text-white'
                        : isItemOrderable(item)
                          ? 'btn-primary text-white'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {successItem === item.id
                      ? 'Zum Warenkorb hinzugefügt!'
                      : isItemOrderable(item)
                        ? 'Zum Warenkorb hinzufügen'
                        : `Bestellbar ${
                            item.category === 'breakfast' ? '08:30 - 12:00' :
                            item.category === 'lunch' ? '14:00 - 16:00' :
                            item.category === 'dinner' ? '18:00 - 20:00' :
                            item.category === 'drinks' ? '10:00 - 20:00' :
                            ''
                          }`
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {category === 'drinks' ? (
              <Coffee className="w-12 h-12 mx-auto" />
            ) : (
              <UtensilsCrossed className="w-12 h-12 mx-auto" />
            )}
          </div>
          <p className="text-gray-500">
            {searchTerm
              ? 'Keine Ergebnisse gefunden'
              : 'Keine Artikel in dieser Kategorie verfügbar'
            }
          </p>
        </div>
      )}
    </div>
  );
}