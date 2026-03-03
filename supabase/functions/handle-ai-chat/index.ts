import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import OpenAI from 'npm:openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const DEFAULT_SYSTEM_PROMPT =
  'You are a compassionate and insightful spiritual advisor. You provide thoughtful guidance while being supportive and empathetic. Keep responses concise but meaningful.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'OpenAI is not configured', code: 'INTERNAL_ERROR' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return jsonResponse({ error: 'Server configuration error', code: 'INTERNAL_ERROR' }, 500);
    }

    // 2. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // Service role client for all DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body', code: 'INTERNAL_ERROR' }, 400);
    }

    const { session_id, advisor_id, message_content, client_id } = body;

    if (!session_id || typeof session_id !== 'string') {
      return jsonResponse({ error: 'session_id is required and must be a string', code: 'INTERNAL_ERROR' }, 400);
    }

    if (!advisor_id || typeof advisor_id !== 'string') {
      return jsonResponse({ error: 'advisor_id is required and must be a string', code: 'INTERNAL_ERROR' }, 400);
    }

    if (!message_content || typeof message_content !== 'string' || message_content.trim().length === 0) {
      return jsonResponse({ error: 'message_content is required and must be a non-empty string', code: 'INTERNAL_ERROR' }, 400);
    }

    if (!client_id || typeof client_id !== 'string') {
      return jsonResponse({ error: 'client_id is required and must be a string', code: 'INTERNAL_ERROR' }, 400);
    }

    // 4. Verify the session exists, is active, and is an AI session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, status, session_metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('Failed to fetch session:', sessionError);
      return jsonResponse({ error: 'Session not found', code: 'INTERNAL_ERROR' }, 404);
    }

    if (session.status !== 'active') {
      return jsonResponse({ error: 'Session is not active', code: 'INTERNAL_ERROR' }, 400);
    }

    const metadata = session.session_metadata as Record<string, unknown> | null;
    if (!metadata || metadata.ai !== 'true' && metadata.ai !== true) {
      return jsonResponse({ error: 'Session is not an AI session', code: 'INTERNAL_ERROR' }, 400);
    }

    // 5. Fetch advisor details
    const { data: advisor, error: advisorError } = await supabaseAdmin
      .from('advisor_details')
      .select('twin_enabled, system_prompt, twin_text_rate_per_msg')
      .eq('id', advisor_id)
      .single();

    if (advisorError || !advisor) {
      console.error('Failed to fetch advisor details:', advisorError);
      return jsonResponse({ error: 'Advisor details not found', code: 'INTERNAL_ERROR' }, 404);
    }

    // 6. Check if twin is enabled
    if (!advisor.twin_enabled) {
      return jsonResponse({ error: 'AI Twin is not enabled for this advisor', code: 'TWIN_DISABLED' }, 403);
    }

    const ratePerMsg = advisor.twin_text_rate_per_msg || 0;

    // 7. Fetch client credit balance
    const { data: clientProfile, error: clientError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', client_id)
      .single();

    if (clientError || !clientProfile) {
      console.error('Failed to fetch client profile:', clientError);
      return jsonResponse({ error: 'Client profile not found', code: 'INTERNAL_ERROR' }, 404);
    }

    if ((clientProfile.credits || 0) < ratePerMsg) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402);
    }

    // 8. Deduct credits atomically via RPC
    const { data: newBalance, error: deductError } = await supabaseAdmin
      .rpc('deduct_ai_credits', { p_client_id: client_id, p_amount: ratePerMsg });

    if (deductError) {
      console.error('Failed to deduct credits:', deductError);
      return jsonResponse({ error: 'Failed to deduct credits', code: 'INTERNAL_ERROR' }, 500);
    }

    if (newBalance < 0) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402);
    }

    // 9. Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 10. Embed the client message
    let embedding: number[];
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: message_content,
      });
      embedding = embeddingResponse.data[0].embedding;
    } catch (embErr: any) {
      console.error('Failed to generate embedding:', embErr.message);
      // Continue without RAG context if embedding fails
      embedding = [];
    }

    // 11. Vector search for relevant knowledge base chunks
    let knowledgeContext = '';
    if (embedding.length > 0) {
      const embeddingString = '[' + embedding.join(',') + ']';

      const { data: chunks, error: matchError } = await supabaseAdmin.rpc('match_knowledge_base', {
        p_advisor_id: advisor_id,
        p_query_embedding: embeddingString,
        p_match_count: 3,
        p_match_threshold: 0.5,
      });

      if (matchError) {
        console.error('Knowledge base search failed (non-blocking):', matchError);
      } else if (chunks && chunks.length > 0) {
        const contextParts = chunks.map((chunk: { content: string }) => chunk.content);
        knowledgeContext =
          "Here is relevant context from the advisor's knowledge base:\n---\n" +
          contextParts.join('\n---\n') +
          '\n---\n';
      }
    }

    // 12. Fetch last 5 messages for conversation context
    const { data: recentMessages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('sender_id, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(5);

    if (messagesError) {
      console.error('Failed to fetch recent messages (non-blocking):', messagesError);
    }

    // 13. Build the OpenAI prompt
    const systemPrompt = advisor.system_prompt || DEFAULT_SYSTEM_PROMPT;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // System message with optional knowledge context
    let systemContent = systemPrompt;
    if (knowledgeContext) {
      systemContent += '\n\n' + knowledgeContext;
    }
    messages.push({ role: 'system', content: systemContent });

    // Add recent conversation history
    if (recentMessages && recentMessages.length > 0) {
      for (const msg of recentMessages) {
        const role = msg.sender_id === client_id ? 'user' : 'assistant';
        messages.push({ role, content: msg.content });
      }
    }

    // Add the current user message
    messages.push({ role: 'user', content: message_content });

    // 14. Call OpenAI for the AI response
    let aiResponseContent: string;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      aiResponseContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
    } catch (openaiErr: any) {
      console.error('OpenAI API call failed:', openaiErr.message);
      return jsonResponse({ error: 'Failed to generate AI response', code: 'INTERNAL_ERROR' }, 500);
    }

    // 15. Insert the client message into messages
    const { error: clientMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id,
        sender_id: client_id,
        content: message_content,
        is_ai_generated: false,
      });

    if (clientMsgError) {
      console.error('Failed to insert client message:', clientMsgError);
      // Non-blocking — AI response was already generated
    }

    // 16. Insert the AI response into messages
    const { data: aiMessage, error: aiMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id,
        sender_id: advisor_id,
        content: aiResponseContent,
        is_ai_generated: true,
      })
      .select('id, content, created_at')
      .single();

    if (aiMsgError || !aiMessage) {
      console.error('Failed to insert AI message:', aiMsgError);
      // Return the response even if DB insert failed — client already paid
      return jsonResponse({
        success: true,
        reply: {
          id: crypto.randomUUID(),
          content: aiResponseContent,
          created_at: new Date().toISOString(),
        },
        credits_deducted: ratePerMsg,
      });
    }

    // 17. Return success response
    return jsonResponse({
      success: true,
      reply: {
        id: aiMessage.id,
        content: aiMessage.content,
        created_at: aiMessage.created_at,
      },
      credits_deducted: ratePerMsg,
    });
  } catch (error: any) {
    console.error('Unexpected error in handle-ai-chat:', error);
    return jsonResponse({ error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
  }
});
