import React from 'react';
import { ArrowLeft, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import type { OrderItem, Location } from '../types';
import { supabase } from '../lib/supabase';

interface CartProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmitOrder: (roomNumber: string, firstName: string, lastName: string, phoneNumber: string, location: Location) => Promise<{ id: string } | undefined>;
  isOrderingEnabled?: boolean;
  showLocationIcons?: boolean;
  onBack?: () => void;
}

export function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  isOrderingEnabled = true,
  showLocationIcons = false,
  onBack,
}: CartProps) {
  const [roomNumber, setRoomNumber] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [guestPhoneNumber, setGuestPhoneNumber] = React.useState('');
  const [location, setLocation] = React.useState<Location>('room');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber) {
      setError('Bitte geben Sie Ihre Zimmernummer ein.');
      return;
    }
    if (!firstName || !lastName) {
      setError('Bitte geben Sie Ihren vollständigen Namen ein.');
      return;
    }
    if (!guestPhoneNumber) {
      setError('Bitte geben Sie Ihre Telefonnummer ein.');
      return;
    }
    if (!acceptTerms) {
      setError('Bitte bestätigen Sie die Zimmerverrechnung.');
      return;
    }
    if (items.length === 0) {
      setError('Ihr Warenkorb ist leer.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(undefined);
      await onSubmitOrder(roomNumber, firstName, lastName, guestPhoneNumber, location);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zum Menü
        </button>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-gray-900 flex items-center">
          <ShoppingCart className="w-6 h-6 mr-2 text-accent" />
          Warenkorb
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?')) {
                items.forEach(item => onRemoveItem(item.menuItem.id));
              }
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Alles entfernen
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Ihr Warenkorb ist leer.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div
              key={item.menuItem.id}
              className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.menuItem.name_de}</h3>
                <p className="text-sm text-gray-500">{item.menuItem.description}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.menuItem.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="font-medium text-gray-900">
                  €{(item.menuItem.price * item.quantity).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  €{item.menuItem.price.toFixed(2)} pro Stück
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center text-lg font-medium text-gray-900">
          <span>Gesamt</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Vorname
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError(undefined);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Max"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nachname
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setError(undefined);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Mustermann"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Telefonnummer
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={guestPhoneNumber}
            onChange={(e) => {
              setGuestPhoneNumber(e.target.value);
              setError(undefined);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
            placeholder="+49123456789"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Zimmernummer
          </label>
          <input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            id="roomNumber"
            value={roomNumber}
            onChange={(e) => {
              setRoomNumber(e.target.value);
              setError(undefined);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-lg"
            placeholder="z.B. 101"
          />
        </div>

        <div className="mt-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                setError(undefined);
              }}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <span className="text-sm text-gray-600">
              Ich bestätige, dass der Betrag über meine Zimmerrechnung abgerechnet werden darf
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="block text-lg font-medium text-gray-900 mb-3">
            Wo möchten Sie Ihre Bestellung genießen?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                value: 'room',
                label: 'Zimmerservice',
                description: 'Genießen Sie Ihre Bestellung bequem in Ihrem Zimmer',
                icon: '🛎️'
              },
              {
                value: 'pool',
                label: 'Pool-Service',
                description: 'Lassen Sie sich am Pool verwöhnen',
                icon: '🏊‍♂️'
              },
              {
                value: 'bar',
                label: 'Bar-Service',
                description: 'Entspannen Sie in unserer eleganten Bar',
                icon: '🍸'
              }
            ].map((option) => (
              <div
                key={option.value}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  location === option.value
                    ? 'border-accent bg-accent/5 shadow-md transform scale-105'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-accent/50'
                }`}
                onClick={() => setLocation(option.value as Location)}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium text-gray-900 mb-2">{option.label}</div>
                <div className="text-sm text-gray-600 leading-snug">{option.description}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 mt-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
            !isSubmitting && items.length > 0
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            'Bestellung wird aufgegeben...'
          ) : (
            'Bestellung aufgeben'
          )}
        </button>
      </form>
    </div>
  );
}