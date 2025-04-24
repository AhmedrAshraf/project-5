export type Location = 'pool' | 'room' | 'bar';

export type SpecialType = 'food' | 'drinks' | 'spa';

export interface DailySpecial {
  id: string;
  name: string;
  name_de: string;
  description: string;
  price: number;
  special_type: SpecialType;
  image_url?: string;
  highlight_color?: string;
  valid_from: string;
  valid_until: string;
  time_restrictions?: Record<string, boolean> | null;
}

export interface MenuItem {
  id: string;
  name: string;
  name_de: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'drinks';
  beverage_category?: 'soft_drinks' | 'hot_drinks' | 'cocktails' | 'wine' | 'beer' | 'spirits';
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'drinks';
  menu_category: 'starters' | 'mains' | 'desserts' | 'snacks' | 'beverages';
  beverage_category?: 'soft_drinks' | 'hot_drinks' | 'cocktails' | 'wine' | 'beer' | 'spirits';
  available: boolean;
  is_daily_special?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  time_restrictions?: {
    morning?: boolean;
    lunch?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  } | null;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  roomNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  guest_phone_number: string;
  firstName: string;
  lastName: string;
  location: Location;
  items: OrderItem[];
  total: number;
  status: 'new' | 'processing' | 'completed';
  timestamp: Date;
}

export interface AdminUser {
  username: string;
  role: 'admin' | 'staff';
}