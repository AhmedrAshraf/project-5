import React from 'react';
import { Clock, Filter, Search } from 'lucide-react';
import type { Order } from '../../types';

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export function OrderList({ orders, loading, onUpdateStatus }: OrderListProps) {
  const [filter, setFilter] = React.useState<Order['status'] | 'all'>('all');
  const [search, setSearch] = React.useState('');
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);

  const filteredOrders = orders
    .filter(order => filter === 'all' || order.status === filter)
    .filter(order => 
      search === '' ||
      order.roomNumber.includes(search) || 
      order.location.includes(search.toLowerCase()) ||
      order.firstName.toLowerCase().includes(search.toLowerCase()) ||
      order.lastName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Bestellungen</h2>
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <div className={`space-y-4 ${isFilterVisible ? 'block' : 'hidden sm:block'}`}>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Name, Zimmer oder Ort suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'new', 'processing', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as Order['status'] | 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === status
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'Alle'}
                {status === 'new' && 'Neu'}
                {status === 'processing' && 'In Bearbeitung'}
                {status === 'completed' && 'Abgeschlossen'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Bestellungen werden geladen...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Bestellungen gefunden
        </div>
      ) : (
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {order.firstName} {order.lastName}
                </h3>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                  className={`px-3 py-2 rounded-full text-sm font-medium tap-target ${
                    order.status === 'new'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  <option value="new">Neu</option>
                  <option value="processing">In Bearbeitung</option>
                  <option value="completed">Abgeschlossen</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Tel:</span> {order.guest_phone_number}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Zimmer {order.roomNumber}</span> • {' '}
                  {order.location === 'room' ? 'Zimmerservice' : order.location === 'pool' ? 'Pool' : 'Bar'}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {order.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex justify-between text-sm flex-wrap gap-1"
                >
                  <span>
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="text-gray-600">
                    {(item.menuItem.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between font-medium gap-2">
              <span>Gesamtsumme</span>
              <span>{order.total.toFixed(2)} €</span>
            </div>
          </div>
        ))}
      </div>)}
    </div>
  );
}