import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import OpenAI from 'npm:openai@4';
import pdfParse from 'npm:pdf-parse';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

/**
 * Splits text into chunks of approximately `chunkSize` characters
 * with `overlap` characters of overlap between consecutive chunks.
 */
function chunkText(text: string, chunkSize = 2000, overlap = 200): string[] {
  const chunks: string[] = [];
  if (!text || text.trim().length === 0) {
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    // If we've reached the end of the text, stop
    if (end >= text.length) break;
    // Move forward by chunkSize minus overlap
    start += chunkSize - overlap;
  }

  return chunks;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const jsonResponse = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not set in edge function secrets');
      return jsonResponse({ error: 'OpenAI is not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
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

    // Rate limit: 10 requests per hour per user
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, 'ingest-knowledge', 10, 60);
    if (!rateCheck.allowed) {
      return jsonResponse({
        error: 'Rate limit exceeded. Please try again later.',
        retry_after_seconds: rateCheck.retryAfterSeconds,
      }, 429);
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { advisor_id, file_path, filename } = body;

    if (!advisor_id || typeof advisor_id !== 'string') {
      return jsonResponse({ error: 'advisor_id is required and must be a string' }, 400);
    }

    if (!file_path || typeof file_path !== 'string') {
      return jsonResponse({ error: 'file_path is required and must be a string' }, 400);
    }

    if (!filename || typeof filename !== 'string') {
      return jsonResponse({ error: 'filename is required and must be a string' }, 400);
    }

    // 4. Verify caller is the advisor or an admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile) {
      console.error('Failed to fetch caller profile:', profileError);
      return jsonResponse({ error: 'Failed to verify user role' }, 500);
    }

    const isAdmin = callerProfile.role === 'admin';
    const isOwner = user.id === advisor_id;

    if (!isAdmin && !isOwner) {
      return jsonResponse({ error: 'Forbidden: you can only ingest documents for your own advisor profile' }, 403);
    }

    // 5. Download the file from training_docs Storage bucket
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('training_docs')
      .download(file_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file from storage:', downloadError);
      return jsonResponse({ error: 'Failed to download file from storage' }, 404);
    }

    // 5a. Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileData.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: `File too large. Maximum size is 10MB, got ${(fileData.size / 1024 / 1024).toFixed(1)}MB` }, 400);
    }

    // 6. Extract text content based on file extension + magic byte validation
    const lowerFilename = filename.toLowerCase();
    let textContent: string;

    if (lowerFilename.endsWith('.txt') || lowerFilename.endsWith('.md')) {
      textContent = await fileData.text();
    } else if (lowerFilename.endsWith('.pdf')) {
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Validate PDF magic bytes: must start with %PDF-
        if (buffer.length < 5 ||
            buffer[0] !== 0x25 || // %
            buffer[1] !== 0x50 || // P
            buffer[2] !== 0x44 || // D
            buffer[3] !== 0x46 || // F
            buffer[4] !== 0x2D    // -
        ) {
          return jsonResponse({ error: 'Invalid PDF file: file signature does not match PDF format' }, 400);
        }

        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } catch (pdfError: any) {
        console.error('Failed to parse PDF:', pdfError);
        return jsonResponse({ error: 'Failed to parse PDF file' }, 400);
      }
    } else {
      return jsonResponse({ error: 'Unsupported file type. Supported formats: .txt, .md, .pdf' }, 400);
    }

    if (!textContent || textContent.trim().length === 0) {
      return jsonResponse({ error: 'File contains no extractable text content' }, 400);
    }

    // 7. Chunk the text into ~500 token segments (~2000 characters with 200 char overlap)
    const chunks = chunkText(textContent, 2000, 200);

    if (chunks.length === 0) {
      return jsonResponse({ error: 'No text chunks could be generated from the file' }, 400);
    }

    // Cap chunks to prevent unbounded OpenAI embedding costs
    const MAX_CHUNKS = 500;
    if (chunks.length > MAX_CHUNKS) {
      return jsonResponse({
        error: `File too large: produced ${chunks.length} chunks (max ${MAX_CHUNKS}). Please use a smaller file.`,
      }, 400);
    }

    console.log(`File "${filename}" produced ${chunks.length} chunks`);

    // 8. Delete existing chunks for the same source_filename and advisor_id (allows re-upload/update)
    const { error: deleteError } = await supabaseAdmin
      .from('knowledge_base_documents')
      .delete()
      .eq('advisor_id', advisor_id)
      .eq('source_filename', filename);

    if (deleteError) {
      console.error('Failed to delete existing chunks:', deleteError);
      return jsonResponse({ error: 'Failed to clear existing document chunks' }, 500);
    }

    // 9. Generate embeddings for all chunks via OpenAI (batch call)
    const openai = new OpenAI({ apiKey: openaiApiKey });

    let embeddingResponse;
    try {
      embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks,
      });
    } catch (embeddingError: any) {
      console.error('OpenAI embedding API error:', embeddingError);
      return jsonResponse({ error: 'Failed to generate embeddings' }, 500);
    }

    if (!embeddingResponse.data || embeddingResponse.data.length !== chunks.length) {
      console.error(
        `Embedding count mismatch: expected ${chunks.length}, got ${embeddingResponse.data?.length ?? 0}`
      );
      return jsonResponse({ error: 'Embedding generation returned unexpected results' }, 500);
    }

    // 10. Insert all chunks + embeddings into knowledge_base_documents
    const rows = chunks.map((chunk, index) => ({
      advisor_id,
      source_filename: filename,
      chunk_index: index,
      content: chunk,
      embedding: embeddingResponse.data[index].embedding,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('knowledge_base_documents')
      .insert(rows);

    if (insertError) {
      console.error('Failed to insert knowledge base chunks:', insertError);
      return jsonResponse({ error: 'Failed to store document chunks in database' }, 500);
    }

    // 11. Return success
    console.log(`Successfully ingested ${chunks.length} chunks for advisor ${advisor_id} from "${filename}"`);
    return jsonResponse({ success: true, chunks_inserted: chunks.length });
  } catch (error: any) {
    console.error('Unexpected error in ingest-knowledge:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
