import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: cors });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return reply(405, { error: 'Método não permitido.' });

  try {
    const authorization = request.headers.get('Authorization') || '';
    if (!/^Bearer\s+\S+$/i.test(authorization)) return reply(401, { error: 'Faça login novamente.' });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: allowed, error } = await supabase.rpc('seacom_can_manage_checkin_location');
    if (error || allowed !== true) return reply(403, { error: 'Sem permissão para buscar endereços.' });

    const body = await request.json().catch(() => null);
    const address = typeof body?.address === 'string' ? body.address.trim() : '';
    if (address.length < 3 || address.length > 500) return reply(400, { error: 'Digite um endereço válido.' });

    const key = Deno.env.get('GEOAPIFY_API_KEY');
    if (!key) return reply(503, { error: 'Configure GEOAPIFY_API_KEY no Supabase para buscar endereços.' });

    const query = new URLSearchParams({ text: address, filter: 'countrycode:br', limit: '5', lang: 'pt', format: 'json', apiKey: key });
    const response = await fetch('https://api.geoapify.com/v1/geocode/search?' + query, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return reply(502, { error: 'O serviço de endereços está indisponível. Tente novamente.' });
    const { results = [] } = await response.json();
    return reply(200, {
      results: results.filter((item: any) => item.formatted && Number.isFinite(item.lat) && Number.isFinite(item.lon))
        .map((item: any) => ({ address: item.formatted, latitude: item.lat, longitude: item.lon })),
    });
  } catch {
    return reply(502, { error: 'Não foi possível pesquisar o endereço agora.' });
  }
});
