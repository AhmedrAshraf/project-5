// @deno-types="npm:@types/twilio@4.9.1"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STAFF_PHONE_NUMBER = '+491712793357';
const CUSTOMER_PHONE_NUMBER = '+19123485784';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Missing Twilio configuration');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order details in a single query with minimal fields
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        room_number,
        location,
        first_name,
        last_name,
        guest_phone_number,
        order_items (
          quantity,
          menu_item_id
        )
      `)
      .eq('id', orderId)
      .limit(1)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Fetch menu item names in a separate query
    const menuItemIds = order.order_items.map(item => item.menu_item_id);
    const { data: menuItems, error: menuError } = await supabaseClient
      .from('menu_items')
      .select('id, name_de')
      .in('id', menuItemIds)
      .limit(menuItemIds.length);

    if (menuError) {
      throw new Error('Failed to fetch menu items');
    }

    // Create a map of menu item IDs to names for efficient lookup
    const menuItemMap = new Map(
      menuItems?.map(item => [item.id, item.name_de]) || []
    );

    // Format order items
    const itemsList = order.order_items
      .map(item => `${item.quantity}x ${menuItemMap.get(item.menu_item_id) || 'Unknown Item'}`)
      .join('\n');

    // Construct staff message
    const message = `Neue Bestellung #${orderId.slice(-4)}!\n\n` +
      `Bestellung:\n${itemsList}\n\n` +
      `Lieferort: ${order.location === 'room' ? `Zimmer ${order.room_number}` : order.location === 'pool' ? 'Pool' : 'Bar'}\n` +
      `Name: ${order.first_name} ${order.last_name}\n` +
      `Tel: ${order.guest_phone_number}`;

    // Make request to Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: STAFF_PHONE_NUMBER,
        From: CUSTOMER_PHONE_NUMBER,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send SMS: ${errorData.message}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});