import { createClient } from 'npm:@supabase/supabase-js@2';

const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

Deno.serve(async (request) => {
  const site = Deno.env.get('SEACOM_SITE_URL')?.trim().replace(/\/+$/, '');
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!site || !url || !anon || !service) {
    return Response.json({ code: 'unavailable' }, { status: 503 });
  }

  const origin = new URL(site).origin;
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
  const reply = (code: string, status = 200) => Response.json({ code }, { status, headers });

  if (request.headers.get('Origin') !== origin) return reply('forbidden', 403);
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply('method', 405);

  let email: string;
  try {
    const body = await request.json();
    if (typeof body?.email !== 'string') return reply('invalid_email', 400);
    email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply('invalid_email', 400);
  } catch {
    return reply('invalid_email', 400);
  }

  try {
    const admin = createClient(url, service, { auth: authOptions });
    const { data: target, error: lookupError } = await admin.rpc(
      'seacom_registration_recovery_target', { p_email: email },
    );
    if (lookupError) return lookupError.code === 'PT429' ? reply('rate_limit', 429) : reply('unavailable', 503);
    if (!target) return reply('invalid_email', 404);

    const client = createClient(url, anon, { auth: authOptions });
    const { error } = await client.auth.resetPasswordForEmail(target, { redirectTo: site + '/redefinir-senha' });
    if (error) return error.status === 429 ? reply('rate_limit', 429) : reply('unavailable', 503);
    return reply('sent');
  } catch {
    return reply('unavailable', 503);
  }
});
