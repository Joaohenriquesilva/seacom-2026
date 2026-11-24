import { createClient } from 'npm:@supabase/supabase-js@2';

// Envia ao PRÓPRIO participante autenticado o e-mail de confirmação da inscrição,
// com o protocolo e a relação de atividades em que ele está inscrito.
// Segurança: o destinatário e os dados vêm sempre do token (JWT) do usuário e do banco,
// nunca do corpo da requisição — a função não pode ser usada para enviar e-mail a terceiros.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const TZ = 'America/Rio_Branco';
const MIN_INTERVAL_SECONDS = 60; // evita reenvios em sequência (abuso / duplo clique)

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(iso));
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const dayKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso)); // AAAA-MM-DD

type Activity = { id: string; title: string; activity_type: string | null; starts_at: string; ends_at: string | null; location: string | null };

function buildEmail(opts: { name: string; protocol: string; activities: Activity[]; siteUrl: string }) {
  const { name, protocol, activities, siteUrl } = opts;
  const firstName = name.trim().split(/\s+/)[0] || 'participante';

  // Agrupa por dia, mantendo a ordem cronológica.
  const days = new Map<string, Activity[]>();
  for (const a of activities) {
    const k = dayKey(a.starts_at);
    if (!days.has(k)) days.set(k, []);
    days.get(k)!.push(a);
  }

  let htmlDays = '';
  let textDays = '';
  for (const list of days.values()) {
    const heading = fmtDay(list[0].starts_at);
    const headingCap = heading.charAt(0).toUpperCase() + heading.slice(1);
    htmlDays += `<tr><td style="padding:18px 0 6px;font-size:13px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:.04em">${esc(headingCap)}</td></tr>`;
    textDays += `\n${headingCap.toUpperCase()}\n`;
    for (const a of list) {
      const hora = fmtTime(a.starts_at) + (a.ends_at ? ` – ${fmtTime(a.ends_at)}` : '');
      const meta = [hora, a.location].filter(Boolean).join(' • ');
      htmlDays += `<tr><td style="padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
        <div style="font-size:15px;font-weight:700;color:#0f172a">${esc(a.title)}</div>
        <div style="font-size:13px;color:#475569;margin-top:3px">${esc(meta)}</div></td></tr>
        <tr><td style="height:8px"></td></tr>`;
      textDays += `- ${a.title}\n  ${meta}\n`;
    }
  }

  const subject = `SEACOM 2026 — Inscrição confirmada (protocolo ${protocol})`;
  const count = activities.length;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px">
    <tr><td style="font-size:13px;font-weight:700;color:#4338ca">SEACOM 2026</td></tr>
    <tr><td style="font-size:22px;font-weight:800;color:#0f172a;padding-top:6px">Inscrição confirmada!</td></tr>
    <tr><td style="font-size:15px;color:#334155;padding-top:14px;line-height:1.5">Olá, ${esc(firstName)}! Sua inscrição foi registrada com sucesso.</td></tr>
    <tr><td style="padding-top:14px"><div style="background:#eef2ff;border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:12px;color:#4338ca;font-weight:700">PROTOCOLO</div>
      <div style="font-size:22px;font-family:Consolas,monospace;font-weight:800;color:#1e1b4b;margin-top:4px">${esc(protocol)}</div></div></td></tr>
    <tr><td style="font-size:15px;color:#334155;padding-top:18px;font-weight:700">Você está inscrito em ${count} ${count === 1 ? 'atividade' : 'atividades'}:</td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${htmlDays}</table></td></tr>
    <tr><td style="font-size:13px;color:#475569;padding-top:14px;line-height:1.5">Sua presença será registrada no local, por QR Code, no dia de cada atividade. Guarde o protocolo acima.</td></tr>
    ${siteUrl ? `<tr><td style="padding-top:18px"><a href="${esc(siteUrl)}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px">Acessar o site da SEACOM</a></td></tr>` : ''}
    <tr><td style="font-size:12px;color:#94a3b8;padding-top:22px">Você recebeu este e-mail porque se inscreveu na SEACOM 2026. Se não foi você, ignore esta mensagem.</td></tr>
  </table></td></tr></table></body></html>`;

  const text = `SEACOM 2026 — Inscrição confirmada\n\nOlá, ${firstName}! Sua inscrição foi registrada com sucesso.\nProtocolo: ${protocol}\n\nVocê está inscrito em ${count} ${count === 1 ? 'atividade' : 'atividades'}:\n${textDays}\nSua presença será registrada no local, por QR Code, no dia de cada atividade.\n${siteUrl ? `\nSite: ${siteUrl}\n` : ''}`;
  return { subject, html, text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Método não permitido.' });
  try {
    const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoKey = Deno.env.get('BREVO_API_KEY')?.trim();
    const from = Deno.env.get('SEACOM_EMAIL_FROM')?.trim();
    const senderName = Deno.env.get('SEACOM_EMAIL_FROM_NAME')?.trim() || 'SEACOM 2026';
    if (!url || !anon || !service) return reply(500, { error: 'Configuração do servidor incompleta.' });
    if (!brevoKey || !from) return reply(500, { error: 'Envio de e-mail não configurado (BREVO_API_KEY / SEACOM_EMAIL_FROM).' });
    // Aceita o formato de remetente usado na configuração anterior do Resend.
    const legacySender = /^([^<>]*)<([^<>]+)>$/.exec(from);
    const sender = { email: legacySender?.[2].trim() || from, name: legacySender?.[1].trim() || senderName };

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return reply(401, { error: 'Sessão ausente.' });
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user || !user.email) return reply(401, { error: 'Sessão inválida.' });

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: participant, error: pErr } = await admin.from('participants')
      .select('id,full_name').eq('auth_user_id', user.id).maybeSingle();
    if (pErr) return reply(500, { error: 'Não foi possível localizar o participante.' });
    if (!participant) return reply(404, { error: 'Inscrição não encontrada.' });

    const { data: registration, error: rErr } = await admin.from('registrations')
      .select('id,protocol').eq('participant_id', participant.id).neq('status', 'cancelled')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (rErr) return reply(500, { error: 'Não foi possível localizar a inscrição.' });
    if (!registration) return reply(404, { error: 'Inscrição não encontrada.' });

    // Reserva o envio de forma atômica: só um pedido por janela de tempo passa.
    const cutoff = new Date(Date.now() - MIN_INTERVAL_SECONDS * 1000).toISOString();
    const { data: claimed, error: claimErr } = await admin.from('registrations')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', registration.id)
      .or(`confirmation_email_sent_at.is.null,confirmation_email_sent_at.lt.${cutoff}`)
      .select('id');
    if (claimErr) return reply(500, { error: 'Não foi possível preparar o envio.' });
    if (!claimed?.length) return reply(429, { error: 'Um e-mail foi enviado há pouco. Aguarde um minuto para pedir outro.' });

    const release = () => admin.from('registrations').update({ confirmation_email_sent_at: null }).eq('id', registration.id);

    const { data: links, error: lErr } = await admin.from('registration_activities')
      .select('activity_id').eq('registration_id', registration.id);
    if (lErr || !links?.length) { await release(); return reply(404, { error: 'Nenhuma atividade encontrada para esta inscrição.' }); }

    const { data: activities, error: aErr } = await admin.from('activities')
      .select('id,title,activity_type,starts_at,ends_at,location')
      .in('id', links.map((l: { activity_id: string }) => l.activity_id)).order('starts_at', { ascending: true });
    if (aErr || !activities?.length) { await release(); return reply(500, { error: 'Não foi possível carregar as atividades.' }); }

    const siteUrl = (Deno.env.get('SEACOM_SITE_URL') || '').replace(/\/$/, '');
    const { subject, html, text } = buildEmail({
      name: participant.full_name, protocol: registration.protocol, activities: activities as Activity[], siteUrl,
    });

    const replyTo = Deno.env.get('SEACOM_EMAIL_REPLY_TO')?.trim();
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        to: [{ email: user.email }],
        subject,
        htmlContent: html,
        textContent: text,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });
    if (!resp.ok) {
      await release();
      const detail = await resp.json().catch(() => null);
      console.error('Brevo recusou o envio', resp.status, detail?.code);
      return reply(502, { error: 'O serviço de e-mail recusou o envio. Tente novamente mais tarde.' });
    }
    return reply(200, { ok: true });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'Erro inesperado ao enviar o e-mail.' });
  }
});
