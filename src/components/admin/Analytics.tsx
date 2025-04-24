import React from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, UtensilsCrossed, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MenuItem } from '../../types';

interface SalesData {
  menuItemId: string;
  itemName: string;
  totalQuantity: number;
  totalRevenue: number;
  averageOrderSize: number;
  orderDate: string;
}

export function Analytics() {
  const [salesData, setSalesData] = React.useState<SalesData[]>([]);
  const [timeRange, setTimeRange] = React.useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'food' | 'drinks'>('all');
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSalesData(selectedDate);
  }, [timeRange, categoryFilter, selectedDate]);

  const fetchSalesData = async (date: string) => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date(date);
      
      const startDate = new Date(endDate);
      
      if (timeRange === 'today') {
        // Today: from midnight to now
        startDate.setHours(0, 0, 0, 0); // Start of same day
        endDate.setHours(23, 59, 59, 999); // End of same day
      } else if (timeRange === 'yesterday') {
        // Yesterday: full 24h period
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeRange === 'week') {
        // Last 7 days
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Last 30 days
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      // Fetch order items with menu details
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price_at_time,
          menu_items (
            id,
            name_de,
            category,
            price,
            is_daily_special
          ),
          orders (
            created_at
          )
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())
        .order('created_at', { foreignTable: 'orders', ascending: false });

      if (error) throw error;

      // Process data
      const salesMap = new Map<string, SalesData>();
      
      orderItems
        .filter(item => {
          // Skip items without orders or menu items
          if (!item.orders || !item.menu_items) return false;
          
          if (categoryFilter === 'all') return true;
          if (categoryFilter === 'food') return item.menu_items?.category !== 'drinks';
          return item.menu_items?.category === 'drinks';
        })
        .forEach(item => {
          // Add null checks for both orders and menu_items
          if (!item.orders || !item.menu_items) return;
          
          const menuItem = item.menu_items;
          const existing = salesMap.get(menuItem.id) || {
            menuItemId: menuItem.id,
            itemName: menuItem.name_de,
            totalQuantity: 0,
            totalRevenue: 0,
            averageOrderSize: 0,
            orderDate: item.orders.created_at
          };

          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.price_at_time * item.quantity;
          existing.averageOrderSize = existing.totalRevenue / existing.totalQuantity;

          salesMap.set(menuItem.id, existing);
        });

      setSalesData(Array.from(salesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue));
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-playfair flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-accent hidden sm:block" />
          Verkaufsanalyse {selectedDate && new Date(selectedDate).toLocaleDateString()}
        </h2>
      </div>
      
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">

        <div className="flex flex-wrap gap-2">
          <div className="text-sm font-medium text-gray-700 w-full sm:w-auto mb-1 sm:mb-0 sm:mr-2 sm:self-center">
            Zeitraum:
          </div>
          {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'today' && 'Heute'}
              {range === 'yesterday' && 'Gestern'}
              {range === 'week' && 'Diese Woche'}
              {range === 'month' && 'Dieser Monat'}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="text-sm font-medium text-gray-700 w-full sm:w-auto mb-1 sm:mb-0 sm:mr-2 sm:self-center">
            Kategorie:
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              categoryFilter === 'all'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Alle
          </button>
          <button
            onClick={() => setCategoryFilter('food')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              categoryFilter === 'food' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" /> Speisen
          </button>
          <button
            onClick={() => setCategoryFilter('drinks')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              categoryFilter === 'drinks' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Coffee className="w-4 h-4" /> Getränke
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Daten werden geladen...</p>
        </div>
      ) : salesData.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Keine Verkaufsdaten für diesen Zeitraum verfügbar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-green-800 font-medium">Gesamtumsatz</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                €{salesData.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-800 font-medium">Verkaufte Artikel</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {salesData.reduce((sum, item) => sum + item.totalQuantity, 0)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-purple-800 font-medium">Ø Bestellwert</h3>
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                €{(salesData.reduce((sum, item) => sum + item.totalRevenue, 0) / 
                   salesData.reduce((sum, item) => sum + item.totalQuantity, 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Sales Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Artikel</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Menge</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Umsatz</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Ø Preis</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Letzte Bestellung</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item) => (
                  <tr key={item.menuItemId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.menuItemId.includes('drinks') ? (
                          <Coffee className="w-4 h-4 text-gray-400" />
                        ) : (
                          <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                        )}
                        {item.itemName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">{item.totalQuantity}</td>
                    <td className="py-3 px-4 text-right">€{item.totalRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">€{item.averageOrderSize.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      {new Date(item.orderDate).toLocaleDateString()} {new Date(item.orderDate).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}