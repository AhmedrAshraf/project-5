export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: 'breakfast' | 'lunch' | 'dinner' | 'drinks'
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: 'breakfast' | 'lunch' | 'dinner' | 'drinks'
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: 'breakfast' | 'lunch' | 'dinner' | 'drinks'
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          room_number: string
          location: 'pool' | 'terrace' | 'room' | 'restaurant' | 'bar'
          status: 'new' | 'processing' | 'completed'
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: string
          location: 'pool' | 'terrace' | 'room' | 'restaurant' | 'bar'
          status?: 'new' | 'processing' | 'completed'
          total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: string
          location?: 'pool' | 'terrace' | 'room' | 'restaurant' | 'bar'
          status?: 'new' | 'processing' | 'completed'
          total?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_time: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_time: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price_at_time?: number
          created_at?: string
        }
      }
    }
  }
}