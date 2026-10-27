import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Método não permitido.' });
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anon || !service) return reply(500, { error: 'Configuração do servidor incompleta.' });
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return reply(401, { error: 'Sessão ausente.' });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    // Valida a sessão com o Auth usando a credencial do servidor, não a chave pública.
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return reply(401, { error: 'Sessão inválida ou expirada. Faça login novamente.' });
    const { data: owner, error: ownerError } = await admin.from('admin_members')
      .select('is_owner,is_active').eq('user_id', user.id).maybeSingle();
    if (ownerError) return reply(500, { error: 'Não foi possível verificar a autorização.' });
    if (!owner?.is_owner || !owner.is_active) return reply(403, { error: 'Somente a administração principal pode excluir organizadores.' });
    const body = await req.json().catch(() => ({}));
    const uid = body?.user_id;
    if (typeof uid !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid))
      return reply(400, { error: 'Identificador de usuário inválido.' });
    if (uid === user.id) return reply(403, { error: 'Não é permitido excluir sua própria conta.' });
    const { data: target, error: targetError } = await admin.from('admin_members')
      .select('user_id,is_owner').eq('user_id', uid).maybeSingle();
    if (targetError) return reply(500, { error: 'Não foi possível consultar o organizador.' });
    if (!target || target.is_owner) return reply(403, { error: 'Organizador inexistente ou conta proprietária protegida.' });
    // Revoga acesso antes de excluir a conta. Se o Auth falhar, o usuário permanece sem acesso administrativo.
    const { error: revokeError } = await admin.from('admin_members').update({ is_active: false }).eq('user_id', uid).eq('is_owner', false);
    if (revokeError) return reply(500, { error: 'Não foi possível bloquear o acesso do organizador.' });
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) return reply(500, { error: 'A conta foi desativada, mas a exclusão no Auth falhou. Verifique dependências no banco antes de tentar novamente.' });
    // Em instalações sem ON DELETE CASCADE na tabela admin_members, remova o registro órfão.
    const { error: cleanupError } = await admin.from('admin_members').delete().eq('user_id', uid).eq('is_owner', false);
    if (cleanupError) return reply(500, { error: 'Conta removida do Auth, mas restou um registro administrativo. Verifique admin_members.' });
    return reply(200, { ok: true });
  } catch {
    return reply(500, { error: 'Erro inesperado ao excluir organizador.' });
  }
});
