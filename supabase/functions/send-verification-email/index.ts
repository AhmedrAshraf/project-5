// @deno-types="npm:@types/nodemailer@6.4.14"
import nodemailer from 'npm:nodemailer@6.9.9';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, tenant_id } = await req.json();

    if (!email || !tenant_id) {
      throw new Error('Email and tenant_id are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get tenant settings
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('name, email_templates')
      .eq('id', tenant_id)
      .single();

    if (tenantError) throw tenantError;

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update user record with verification token
    const { error: updateError } = await supabaseClient
      .from('tenant_users')
      .update({
        verification_token: verificationToken,
        verification_token_expires_at: expiresAt.toISOString()
      })
      .eq('email', email)
      .eq('tenant_id', tenant_id);

    if (updateError) throw updateError;

    // Get email template
    const template = tenant.email_templates.verification;
    const verificationLink = `${Deno.env.get('PUBLIC_URL')}/verify-email?token=${verificationToken}&tenant=${tenant_id}`;
    
    // Replace template variables
    const subject = template.subject.replace('{tenant_name}', tenant.name);
    const content = template.content
      .replace('{tenant_name}', tenant.name)
      .replace('{verification_link}', verificationLink);

    // Send email
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: Deno.env.get('SMTP_SECURE') === 'true',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS')
      }
    });

    await transporter.sendMail({
      from: Deno.env.get('SMTP_FROM'),
      to: email,
      subject,
      text: content
    });

    return new Response(
      JSON.stringify({ success: true }),
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