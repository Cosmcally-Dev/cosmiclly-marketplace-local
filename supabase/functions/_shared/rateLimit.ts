import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Check and enforce per-user rate limiting using a sliding window stored in the `rate_limits` table.
 *
 * @param supabase - Supabase client with service role (bypasses RLS)
 * @param userId - The authenticated user's ID
 * @param endpoint - Identifier for the endpoint (e.g., 'handle-ai-chat', 'ingest-knowledge')
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMinutes - Length of the sliding window in minutes
 * @returns RateLimitResult indicating whether the request is allowed
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  // Fetch the current rate limit record for this user + endpoint
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, window_start, request_count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine (first request)
    console.error('Rate limit fetch error:', fetchError);
    // Fail open — don't block users if rate limit table is unavailable
    return { allowed: true, remaining: maxRequests };
  }

  if (!existing) {
    // First request from this user for this endpoint — create record
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        endpoint,
        window_start: now.toISOString(),
        request_count: 1,
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
      return { allowed: true, remaining: maxRequests };
    }

    return { allowed: true, remaining: maxRequests - 1 };
  }

  const existingWindowStart = new Date(existing.window_start);

  if (existingWindowStart < windowStart) {
    // Window has expired — reset the counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        window_start: now.toISOString(),
        request_count: 1,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Rate limit reset error:', updateError);
    }

    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Window is still active — check count
  if (existing.request_count >= maxRequests) {
    const windowEndMs = existingWindowStart.getTime() + windowMinutes * 60 * 1000;
    const retryAfterSeconds = Math.ceil((windowEndMs - now.getTime()) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  // Increment the counter
  const { error: incrementError } = await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('id', existing.id);

  if (incrementError) {
    console.error('Rate limit increment error:', incrementError);
  }

  return { allowed: true, remaining: maxRequests - existing.request_count - 1 };
}
