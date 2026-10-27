import ModulosAdmin from './ModulosAdmin';
import React, { useEffect, useState } from 'react';

type Member = { user_id: string; display_name: string; profile_id: string; is_owner: boolean; is_active: boolean; email: string; overrides: Record<string, boolean> };
const profileNames: Record<string,string> = {owner:'Administração principal',communication:'Comunicação',programming:'Programação',registration:'Inscrições',checkin:'Credenciamento',viewer:'Consulta'};
const groups: Record<string,string[]> = {
 Programação:['visualizar','criar','editar','excluir','publicar'],
 Palestrantes:['visualizar','criar','editar','excluir'],
 Notícias:['visualizar','criar','editar','excluir','publicar'],
 Inscrições:['visualizar','confirmar','cancelar','exportar'],
 Credenciamento:['visualizar','presenca'],
 Site:['editar']
};
const keys: Record<string,string> = {'Programação':'programacao','Palestrantes':'palestrantes','Notícias':'noticias','Inscrições':'inscricoes','Credenciamento':'credenciamento','Site':'site'};
const labels: Record<string,string> = {visualizar:'Visualizar',criar:'Cadastrar',editar:'Editar',excluir:'Excluir',publicar:'Publicar',confirmar:'Confirmar',cancelar:'Cancelar',exportar:'Exportar',presenca:'Registrar presença'};
export default function AdminSeguro(){
 const [client,setClient]=useState<any>(null),[session,setSession]=useState<any>(null),[member,setMember]=useState<Member|null>(null);
 const [members,setMembers]=useState<Member[]>([]),[editing,setEditing]=useState<Member|null>(null),[deleting,setDeleting]=useState<Member|null>(null);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [newEmail,setNewEmail]=useState(''),[newName,setNewName]=useState(''),[newProfile,setNewProfile]=useState('communication');
 const [newOverrides,setNewOverrides]=useState<Record<string,boolean>>({});
 const [activeTab,setActiveTab]=useState('news');
 useEffect(()=>{let alive=true,subscription:any; (async()=>{try{
  const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Error('Configure .env.local antes de usar o painel.');
  const {createClient}=await import('@supabase/supabase-js'); const sb=createClient(url,key);
  if(!alive)return;setClient(sb);const {data,error}=await sb.auth.getSession();if(error)throw error;
  if(alive)setSession(data.session);const {data:auth}=sb.auth.onAuthStateChange((_event:string,next:any)=>{if(alive)setSession(next)});subscription=auth.subscription;
 }catch(e:any){if(alive)setMessage(e.message)}finally{if(alive)setLoading(false)}})();return()=>{alive=false;subscription?.unsubscribe()}},[]);
 async function refresh(sb:any){const {data,error}=await sb.rpc('seacom_list_organizers');if(error)throw error;setMembers(data||[])}
 useEffect(()=>{let alive=true;setMember(null);setMembers([]);setEditing(null);if(!client||!session?.user?.id)return;
 (async()=>{const {data,error}=await client.from('admin_members').select('user_id,display_name,profile_id,is_owner,is_active').eq('user_id',session.user.id).maybeSingle();
 if(!alive)return;if(error){setMessage('Permissões: '+error.message);return}if(!data?.is_active){setMessage('Conta sem acesso administrativo ativo.');return}
 setMember(data);setMessage('');if(data.is_owner){try{await refresh(client)}catch(e:any){if(alive)setMessage('Execute SQL-ADMIN-ORGANIZADORES.sql no Supabase antes de gerenciar organizadores: '+e.message)}}})();return()=>{alive=false}},[client,session?.user?.id]);
 async function login(e:React.FormEvent){e.preventDefault();setMessage('Autenticando...');const {error}=await client.auth.signInWithPassword({email:email.trim(),password});setPassword('');setMessage(error?'Login: '+error.message:'')}
 async function add(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  const {data:authData,error:authError}=await client.auth.getSession();
  if(authError||!authData.session?.access_token)throw Error('Faça login novamente.');
  const url=import.meta.env.VITE_SUPABASE_URL;
  const response=await fetch(`${url}/functions/v1/seacom-invite-organizer`,{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${authData.session.access_token}`,'apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},
   body:JSON.stringify({email:newEmail.trim(),name:newName.trim(),profile:newProfile,overrides:newOverrides})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.error||`Falha no convite (${response.status}).`);
  await refresh(client);setNewEmail('');setNewName('');setNewOverrides({});
  setMessage('Convite solicitado com sucesso. O organizador deve verificar o e-mail e definir o acesso.');
 }catch(e:any){setMessage(e.message)}finally{setBusy(false)}}
 async function removeOrganizer(){
  if(!deleting||!member?.is_owner||deleting.is_owner||deleting.user_id===session?.user?.id)return;
  setBusy(true);setMessage('');
  try{
   const {data:authData,error:authError}=await client.auth.getSession();
   if(authError||!authData.session?.access_token)throw Error('Faça login novamente.');
   // Renova o token antes de uma operação administrativa destrutiva.
   const {data:renewed,error:renewError}=await client.auth.refreshSession();
   if(renewError||!renewed.session?.access_token)throw Error('Sua sessão expirou. Saia e entre novamente antes de excluir.');
   const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seacom-delete-organizer`,{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${renewed.session.access_token}`,'apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},
    body:JSON.stringify({user_id:deleting.user_id})
   });
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(payload.error||`Falha na exclusão (${response.status}).`);
   setDeleting(null);if(editing?.user_id===deleting.user_id)setEditing(null);
   await refresh(client);setMessage('Organizador excluído com sucesso.');
  }catch(e:any){setMessage('Exclusão: '+e.message)}finally{setBusy(false)}
 }
 async function save(){if(!editing)return;setBusy(true);setMessage('');try{const {error}=await client.rpc('seacom_update_organizer',{p_user_id:editing.user_id,p_name:editing.display_name,p_profile:editing.profile_id,p_active:editing.is_active,p_overrides:editing.overrides||{}});if(error)throw error;await refresh(client);setEditing(null);setMessage('Alterações salvas com sucesso.')}catch(e:any){setMessage(e.message)}finally{setBusy(false)}}
 const field='border border-slate-300 rounded-xl p-2 w-full';
 return <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 min-h-[360px]"><div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5">
 <h1 className="text-2xl font-extrabold text-slate-900">Administração — SEACOM 2026</h1><p className="text-sm text-slate-600">Acesso por Supabase Auth. Permissões verificadas no servidor.</p>
 {message&&<p role="alert" className="bg-amber-50 text-amber-900 rounded-xl p-3 text-sm">{message}</p>}
 {loading?<p>Verificando acesso...</p>:!session?<form onSubmit={login} className="max-w-md space-y-3"><label className="block">E-mail<input type="email" required autoComplete="username" className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block">Senha<input type="password" required autoComplete="current-password" className={field} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="bg-indigo-700 text-white rounded-xl px-5 py-3">Entrar</button></form>:<>
 <div className="flex flex-wrap justify-between gap-3"><span>Conectado: <strong>{session.user.email}</strong></span><button type="button" className="border rounded-xl px-4 py-2" onClick={()=>client.auth.signOut()}>Sair</button></div>
 {member?<><p className="bg-indigo-50 rounded-xl p-3">Perfil: <strong>{profileNames[member.profile_id]||member.profile_id}</strong>{member.is_owner?' — Acesso principal':''}</p>
 <nav aria-label="Seções administrativas" className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">{[...(member.is_owner?[['invite','Convidar organizador'],['organizers','Organizadores e acessos']]:[]),['news','Publicar notícia'],['home','Página inicial e capa'],['attendance','QR Code e presenças']].map(([id,label])=><button key={id} type="button" aria-current={activeTab===id?'page':undefined} onClick={()=>{setActiveTab(id);setMessage('')}} className={'rounded-xl px-4 py-2 text-sm font-semibold transition-colors '+(activeTab===id?'bg-indigo-700 text-white shadow-sm':'border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50')}>{label}</button>)}</nav>
 {member.is_owner&&activeTab==='invite'&&<div className="space-y-3"><h2 className="text-lg font-bold">Convidar organizador</h2><p className="text-sm text-slate-600">Informe o e-mail e escolha as permissões. O sistema envia o convite pelo Supabase Auth; não é necessário cadastrar a pessoa manualmente no Auth.</p>
 <form onSubmit={add} className="space-y-4"><div className="grid sm:grid-cols-2 gap-3"><label>Nome<input className={field} required minLength={2} maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)}/></label><label>E-mail do convidado<input className={field} type="email" required value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></label><label>Perfil padrão<select className={field} value={newProfile} onChange={e=>setNewProfile(e.target.value)}>{Object.entries(profileNames).filter(([k])=>k!=='owner').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
 <p className="text-sm text-slate-600">Permissões individuais: Padrão segue o perfil selecionado; Permitir ou Bloquear substitui o perfil.</p>
 {Object.entries(groups).map(([group,actions])=><div key={group} className="space-y-2 border rounded-xl p-3"><h3 className="font-semibold">{group}</h3><div className="grid sm:grid-cols-2 gap-2">{actions.map(action=>{const k=keys[group]+'.'+action;const value=newOverrides[k];return <label key={k} className="flex items-center justify-between gap-2 text-sm">{labels[action]||action}<select aria-label={'Novo organizador '+group+' '+action} className="border rounded-lg p-2" value={value===undefined?'default':value?'allow':'deny'} onChange={e=>{const next={...newOverrides};if(e.target.value==='default')delete next[k];else next[k]=e.target.value==='allow';setNewOverrides(next)}}><option value="default">Padrão</option><option value="allow">Permitir</option><option value="deny">Bloquear</option></select></label>})}</div></div>)}
 <button disabled={busy} className="bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-5 py-3">{busy?'Enviando convite...':'Enviar convite e salvar permissões'}</button></form></div>}
 {member.is_owner&&activeTab==='organizers'&&<><div className="space-y-2"><h2 className="text-lg font-bold">Organizadores e permissões</h2>{members.map(m=><div key={m.user_id} className="border rounded-xl p-3 flex flex-wrap gap-3 justify-between items-center"><div><strong>{m.display_name||'Sem nome'}</strong><p className="text-sm text-slate-600">{m.email} · {profileNames[m.profile_id]||m.profile_id} · {m.is_active?'Ativo':'Inativo'}</p></div>{!m.is_owner&&<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className="border rounded-xl px-4 py-2" onClick={()=>setEditing({...m,overrides:{...m.overrides}})}>Editar acessos</button><button type="button" disabled={busy} className="border border-red-300 text-red-700 rounded-xl px-4 py-2 disabled:opacity-50" onClick={(e)=>{e.preventDefault();e.stopPropagation();setDeleting(m)}}>Excluir</button></div>}</div>)}</div>
 {deleting&&<div role="dialog" aria-modal="true" aria-labelledby="confirm-delete-organizer" className="border-2 border-red-300 bg-red-50 rounded-2xl p-4 space-y-3"><h2 id="confirm-delete-organizer" className="text-lg font-bold text-red-900">Confirmar exclusão do organizador</h2><p className="text-sm text-red-900">Deseja excluir definitivamente <strong>{deleting.display_name}</strong> ({deleting.email})? A conta será removida do Supabase Auth e perderá o acesso ao painel. Esta ação não pode ser desfeita.</p><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className="bg-red-700 text-white rounded-xl px-5 py-3 disabled:opacity-50" onClick={removeOrganizer}>{busy?'Excluindo...':'Sim, excluir organizador'}</button><button type="button" disabled={busy} className="border rounded-xl px-5 py-3" onClick={()=>setDeleting(null)}>Cancelar</button></div></div>}
 {editing&&<div className="border-2 border-indigo-300 rounded-2xl p-4 space-y-4"><h2 className="font-bold text-lg">Editar: {editing.email}</h2><label className="block">Nome<input className={field} value={editing.display_name||''} onChange={e=>setEditing({...editing,display_name:e.target.value})}/></label><label className="block">Perfil padrão<select className={field} value={editing.profile_id} onChange={e=>setEditing({...editing,profile_id:e.target.value})}>{Object.entries(profileNames).filter(([k])=>k!=='owner').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e=>setEditing({...editing,is_active:e.target.checked})}/> Acesso ativo</label>
 <p className="text-sm text-slate-600">Padrão = segue o perfil; Permitir ou Bloquear = substitui o perfil para esta pessoa.</p>
 {Object.entries(groups).map(([group,actions])=><div key={group} className="space-y-2"><h3 className="font-semibold">{group}</h3><div className="grid sm:grid-cols-2 gap-2">{actions.map(action=>{const k=keys[group]+'.'+action;const value=editing.overrides?.[k];return <label key={k} className="flex items-center justify-between gap-2 text-sm">{labels[action]||action}<select aria-label={group+' '+action} className="border rounded-lg p-2" value={value===undefined?'default':value?'allow':'deny'} onChange={e=>{const overrides={...editing.overrides};if(e.target.value==='default')delete overrides[k];else overrides[k]=e.target.value==='allow';setEditing({...editing,overrides})}}><option value="default">Padrão</option><option value="allow">Permitir</option><option value="deny">Bloquear</option></select></label>})}</div></div>)}
 <div className="flex gap-3"><button type="button" disabled={busy} className="bg-indigo-700 text-white rounded-xl px-5 py-3" onClick={save}>Salvar permissões</button><button type="button" className="border rounded-xl px-5 py-3" onClick={()=>setEditing(null)}>Cancelar</button></div></div>}
 </>}
 <ModulosAdmin isOwner={member.is_owner} activeTab={activeTab}/><p className="text-sm text-slate-600">As inscrições públicas ainda são demonstrativas; o credenciamento exige inscrições reais confirmadas.</p></>:<p>Aguardando confirmação das permissões...</p>}</>}
 </div></section>
}
