import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_drinks: boolean;
}

export function isTimeInSlot(time: Date, start: string, end: string): boolean {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const currentHour = time.getHours();
  const currentMinute = time.getMinutes();
  
  const timeInMinutes = currentHour * 60 + currentMinute;
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  
  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
}

export const getCurrentMenuCategory = (): 'breakfast' | 'lunch' | 'dinner' | null => {
  const hour = new Date().getHours();
  const minutes = new Date().getMinutes();
  const timeInMinutes = hour * 60 + minutes;
  
  // Convert time ranges to minutes for more precise comparison
  const breakfast = { start: 8.5 * 60, end: 12 * 60 }; // 8:30 - 12:00
  const lunch = { start: 14 * 60, end: 16 * 60 };      // 14:00 - 16:00
  const dinner = { start: 18 * 60, end: 20 * 60 };     // 18:00 - 20:00
  
  if (timeInMinutes >= breakfast.start && timeInMinutes <= breakfast.end) return 'breakfast';
  if (timeInMinutes >= lunch.start && timeInMinutes <= lunch.end) return 'lunch';
  if (timeInMinutes >= dinner.start && timeInMinutes <= dinner.end) return 'dinner';
  
  // Return the next available category if no category is currently active
  if (timeInMinutes < breakfast.start) return 'breakfast';
  if (timeInMinutes < lunch.start) return 'lunch';
  if (timeInMinutes < dinner.start) return 'dinner';
  
  // After dinner hours, default to lunch for the next day
  return 'lunch';
};

export const isCurrentlyInTimeSlot = (slotId: string, slots: TimeSlot[]): boolean => {
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return false;

  const now = new Date();
  return isTimeInSlot(now, slot.start_time, slot.end_time);
};