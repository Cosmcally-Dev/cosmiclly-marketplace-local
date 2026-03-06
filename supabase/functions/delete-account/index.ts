import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client to perform admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Anonymize messages
    await supabaseAdmin
      .from('messages')
      .update({ content: '[deleted]' })
      .eq('sender_id', user.id);

    // 2. Delete advisor details (also removes contract_locked_by references)
    await supabaseAdmin
      .from('advisor_details')
      .delete()
      .eq('id', user.id);

    // 3. Delete advisor applications
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profile?.email) {
      await supabaseAdmin
        .from('advisor_applications')
        .delete()
        .eq('email', profile.email);
    }

    // 4. Delete knowledge base documents (advisor training data + embeddings)
    await supabaseAdmin
      .from('knowledge_base_documents')
      .delete()
      .eq('advisor_id', user.id);

    // 5. Delete user favorites (both as user and as favorited advisor)
    await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id);
    await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('advisor_id', user.id);

    // 6. Delete reviews written by the user
    await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('client_id', user.id);

    // 7. Anonymize disputes (preserve record for audit but scrub PII)
    await supabaseAdmin
      .from('disputes')
      .update({ reason: '[deleted]', resolution_notes: '[deleted]' })
      .or(`client_id.eq.${user.id},advisor_id.eq.${user.id}`);

    // 8. Anonymize profile
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: 'Deleted User',
        username: null,
        email: `deleted-${user.id}@deleted.local`,
        avatar_url: null,
        role: 'client',
      })
      .eq('id', user.id);

    // 9. Fix orphaned FK references to auth.users
    await supabaseAdmin
      .from('advisor_applications')
      .update({ reviewed_by: null })
      .eq('reviewed_by', user.id);

    // 10. Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Account deleted for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
