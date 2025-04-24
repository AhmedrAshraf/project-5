import React from 'react';
import { Clock, Plus, Save, X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_drinks: boolean;
  staff_notification_number?: string;
}

export function TimeSlotEditor() {
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingSlot, setEditingSlot] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<TimeSlot>>({});
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newSlot, setNewSlot] = React.useState<Partial<TimeSlot>>({
    label: '',
    start_time: '',
    end_time: '',
    is_drinks: false,
    staff_notification_number: ''
  });

  const fetchTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('start_time');

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTimeSlots();

    const channel = supabase
      .channel('time-slots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_slots'
        },
        () => {
          // Debounce the fetch to prevent rapid re-fetching
          const timeoutId = setTimeout(() => {
            fetchTimeSlots();
          }, 1000);
          return () => clearTimeout(timeoutId);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({
          label: editForm.label,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          is_drinks: editForm.is_drinks,
          staff_notification_number: editForm.staff_notification_number
        })
        .eq('id', id);

      if (error) throw error;
      setEditingSlot(null);
    } catch (error) {
      console.error('Error updating time slot:', error);
      alert('Error updating time slot. Please check the console for details.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('time_slots')
        .insert([{
          ...newSlot,
          is_drinks: newSlot.is_drinks || false
        }]);

      if (error) throw error;
      setShowAddForm(false);
      setNewSlot({
        label: '',
        start_time: '',
        end_time: '',
        is_drinks: false,
        staff_notification_number: ''
      });
    } catch (error) {
      console.error('Error adding time slot:', error);
      alert('Error adding time slot. Please check the console for details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Error deleting time slot. Please check the console for details.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 font-playfair flex items-center">
          <Clock className="w-8 h-8 mr-3 text-accent" />
          Öffnungszeiten
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Neue Öffnungszeit
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Öffnungszeiten werden geladen...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {timeSlots.map(slot => (
            <div
              key={slot.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              {editingSlot === slot.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(slot.id);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bezeichnung
                      </label>
                      <input
                        type="text"
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="elegant-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mitarbeiter-Telefon
                      </label>
                      <input
                        type="tel"
                        value={editForm.staff_notification_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, staff_notification_number: e.target.value })}
                        className="elegant-input"
                        placeholder="+49123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Startzeit
                      </label>
                      <input
                        type="time"
                        value={editForm.start_time || ''}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                        className="elegant-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endzeit
                      </label>
                      <input
                        type="time"
                        value={editForm.end_time || ''}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                        className="elegant-input"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_drinks || false}
                        onChange={(e) => setEditForm({ ...editForm, is_drinks: e.target.checked })}
                        className="rounded border-gray-300 text-accent focus:ring-accent h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">
                        Getränke verfügbar
                      </span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSlot(null)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      Speichern
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {slot.label}
                    </h3>
                    <p className="text-gray-600">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} Uhr
                    </p>
                    {slot.staff_notification_number && (
                      <p className="text-sm text-gray-500 mt-1">
                        Mitarbeiter-Tel: {slot.staff_notification_number}
                      </p>
                    )}
                    {slot.is_drinks && (
                      <span className="inline-flex items-center mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Getränke verfügbar
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSlot(slot.id);
                        setEditForm(slot);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Neue Öffnungszeit hinzufügen
            </h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezeichnung
                  </label>
                  <input
                    type="text"
                    value={newSlot.label}
                    onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
                    className="elegant-input"
                    required
                    placeholder="z.B. Frühstück"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mitarbeiter-Telefon
                  </label>
                  <input
                    type="tel"
                    value={newSlot.staff_notification_number}
                    onChange={(e) => setNewSlot({ ...newSlot, staff_notification_number: e.target.value })}
                    className="elegant-input"
                    placeholder="+49123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit
                  </label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="elegant-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="elegant-input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSlot.is_drinks}
                    onChange={(e) => setNewSlot({ ...newSlot, is_drinks: e.target.checked })}
                    className="rounded border-gray-300 text-accent focus:ring-accent h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">
                    Getränke verfügbar
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}