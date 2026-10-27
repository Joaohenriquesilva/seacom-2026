import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const allowedProfiles = new Set(['communication','programming','registration','checkin','viewer']);
const allowedPermissions = new Set([
 'programacao.visualizar','programacao.criar','programacao.editar','programacao.excluir','programacao.publicar',
 'palestrantes.visualizar','palestrantes.criar','palestrantes.editar','palestrantes.excluir',
 'noticias.visualizar','noticias.criar','noticias.editar','noticias.excluir','noticias.publicar',
 'inscricoes.visualizar','inscricoes.confirmar','inscricoes.cancelar','inscricoes.exportar',
 'credenciamento.visualizar','credenciamento.presenca','site.editar'
]);
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
 try{
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if(!url||!anon||!service)return reply(500,{error:'Configuração do servidor incompleta.'});
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)return reply(401,{error:'Sessão ausente.'});
  const authClient=createClient(url,anon,{auth:{persistSession:false}});
  const {data:{user},error:authError}=await authClient.auth.getUser(token);
  if(authError||!user)return reply(401,{error:'Sessão inválida.'});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:owner,error:ownerError}=await admin.from('admin_members').select('is_owner,is_active').eq('user_id',user.id).maybeSingle();
  if(ownerError)return reply(500,{error:'Não foi possível verificar a autorização.'});
  if(!owner?.is_owner||!owner.is_active)return reply(403,{error:'Somente a administração principal pode enviar convites.'});
  const body=await req.json();
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const name=typeof body.name==='string'?body.name.trim():'';
  const profile=body.profile;
  const overrides=body.overrides??{};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return reply(400,{error:'E-mail inválido.'});
  if(name.length<2||name.length>100||!allowedProfiles.has(profile))return reply(400,{error:'Nome ou perfil inválido.'});
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).some(k=>!allowedPermissions.has(k)||typeof overrides[k]!=='boolean'))return reply(400,{error:'Permissões inválidas.'});
  const siteUrl=Deno.env.get('SEACOM_SITE_URL');
  if(!siteUrl || !/^https?:\/\/[^/]+/.test(siteUrl))return reply(500,{error:'Configure SEACOM_SITE_URL nas secrets da função.'});
  // Invite via Supabase Auth Admin API; never expose service role to the browser.
  const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo: `${(Deno.env.get('SEACOM_SITE_URL') || '').replace(/\/$/, '')}/?auth=invite`, data:{full_name:name}});
  if(inviteError||!invited.user)return reply(400,{error:inviteError?.message||'Não foi possível convidar.'});
  const uid=invited.user.id;
  const {error:memberError}=await admin.from('admin_members').upsert({user_id:uid,display_name:name,profile_id:profile,is_owner:false,is_active:true},{onConflict:'user_id'});
  if(memberError)return reply(500,{error:'Convite criado, mas falhou a atribuição do perfil. Contate o administrador antes de reenviar.'});
  const {error:removeError}=await admin.from('admin_permission_overrides').delete().eq('user_id',uid);
  if(removeError)return reply(500,{error:'Convite criado, mas falhou a atualização de permissões.'});
  const entries=Object.entries(overrides).map(([permission_key,allowed])=>({user_id:uid,permission_key,allowed}));
  if(entries.length){const {error:insertError}=await admin.from('admin_permission_overrides').insert(entries);if(insertError)return reply(500,{error:'Convite criado, mas falhou a gravação das permissões.'});}
  return reply(200,{ok:true});
 }catch{return reply(500,{error:'Erro inesperado ao processar o convite.'});}
});
