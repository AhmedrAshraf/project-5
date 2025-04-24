import React from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import type { Location } from '../types';

interface OrderSuccessProps {
  orderId: string;
  roomNumber: string;
  firstName: string;
  lastName: string;
  location: Location;
  onNewOrder: () => void;
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export function OrderSuccess({ orderId, roomNumber, firstName, lastName, location, onNewOrder }: OrderSuccessProps) {
  React.useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center relative overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute top-0 left-0 right-0 h-2 bg-green-500" />
      
      <div className="w-20 h-20 mx-auto mb-6">
        <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>  
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4 font-playfair">
        Bestellung erfolgreich aufgegeben!
      </h2>

      <p className="text-gray-600 mb-6">
        {firstName} {lastName}, Ihre Bestellung #{orderId.slice(-4)} wurde erfolgreich aufgenommen und wird in Kürze zubereitet.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-medium text-gray-900 mb-4">Bestelldetails</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Zimmernummer</span>
            <span className="font-medium text-gray-900">{roomNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Lieferort</span>
            <span className="font-medium text-gray-900">{
              location === 'room' ? 'Zimmer' :
              location === 'pool' ? 'Pool' :
              location === 'terrace' ? 'Terrasse' :
              location === 'restaurant' ? 'Restaurant' :
              'Bar'
            }</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNewOrder}
        className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
        Neue Bestellung aufgeben
      </button>
    </div>
  );
}