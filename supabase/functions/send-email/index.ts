import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://cosmiclly-marketplace-local.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Email template types — template IDs are configured in Brevo dashboard
type EmailType =
  | 'welcome_client'
  | 'welcome_advisor'
  | 'session_receipt'
  | 'low_credit_warning'
  | 'application_approved'
  | 'application_rejected'
  | 'contact_form';

// Map email types to Brevo template IDs
// These should be set up in Brevo dashboard and IDs updated here
const TEMPLATE_IDS: Record<EmailType, number> = {
  welcome_client: 1,
  welcome_advisor: 2,
  session_receipt: 3,
  low_credit_warning: 4,
  application_approved: 5,
  application_rejected: 6,
  contact_form: 7,
};

interface SendEmailRequest {
  to_email: string;
  to_name: string;
  email_type: EmailType;
  template_params?: Record<string, string | number>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY is not set');
      return jsonResponse({ error: 'Brevo is not configured. Set BREVO_API_KEY in Supabase secrets.' }, 500);
    }

    // Verify authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body: SendEmailRequest = await req.json();
    const { to_email, to_name, email_type, template_params } = body;

    if (!to_email || !email_type) {
      return jsonResponse({ error: 'to_email and email_type are required' }, 400);
    }

    const templateId = TEMPLATE_IDS[email_type];
    if (!templateId) {
      return jsonResponse({ error: `Unknown email type: ${email_type}` }, 400);
    }

    // Call Brevo Transactional Email API
    const brevoPayload = {
      to: [{ email: to_email, name: to_name || to_email }],
      templateId,
      params: {
        NAME: to_name || 'User',
        ...template_params,
      },
    };

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const errorBody = await brevoResponse.text();
      console.error('[send-email] Brevo API error:', brevoResponse.status, errorBody);
      return jsonResponse({
        error: 'Failed to send email',
        details: errorBody,
      }, brevoResponse.status);
    }

    const result = await brevoResponse.json();
    console.log(`[send-email] Sent ${email_type} to ${to_email}, messageId:`, result.messageId);

    return jsonResponse({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error('[send-email] Exception:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
});
