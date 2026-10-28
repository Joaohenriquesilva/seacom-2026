import React,{useEffect,useState} from 'react';

type Position = {latitude:number;longitude:number;accuracy:number};
const OUTSIDE='Usuário Não Presente no Local';
const DENIED='Confirmação Necessária para validar presença';

export default function Checkin(){
 const [client,setClient]=useState<any>(null),[session,setSession]=useState<any>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[position,setPosition]=useState<Position|null>(null),[locating,setLocating]=useState(false);
 const id=new URLSearchParams(window.location.search).get('checkin')||'';
 function requestLocation(){
  setPosition(null);setLocating(true);
  if(!window.isSecureContext||!navigator.geolocation){setMessage('Ative a localização em um navegador com HTTPS para validar a presença.');setLocating(false);return;}
  navigator.geolocation.getCurrentPosition(
   p=>{setPosition({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy});setMessage('');setLocating(false)},
   e=>{setMessage(e.code===1?DENIED:e.code===3?'Não foi possível obter a localização a tempo. Tente novamente.':'Não foi possível identificar sua localização. Ative o GPS e tente novamente.');setLocating(false)},
   {enableHighAccuracy:true,timeout:20000,maximumAge:0}
  );
 }
 useEffect(()=>{let active=true;let sub:any;(async()=>{try{const {supabase:c}=await import('./lib/supabase');if(!active)return;setClient(c);const {data}=await c.auth.getSession();setSession(data.session);const {data:a}=c.auth.onAuthStateChange((_e:any,s:any)=>setSession(s));sub=a.subscription}catch(e:any){setMessage(e.message)}})();requestLocation();return()=>{active=false;sub?.unsubscribe()}},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(!client)return;setBusy(true);const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setMessage(error?error.message:'');setBusy(false)}
 async function checkin(){if(!client||busy)return;if(!position){requestLocation();return;}setBusy(true);try{const {data,error}=await client.rpc('seacom_checkin_local',{p_activity_id:id,p_latitude:position.latitude,p_longitude:position.longitude,p_accuracy:position.accuracy});if(error){setMessage(/fora do local|localização fora|localizacao fora/i.test(error.message)?OUTSIDE:error.message)}else setMessage(data||'Presença confirmada.')}catch{setMessage('Não foi possível validar a presença. Tente novamente.')}finally{setBusy(false)}}
 return <main className="min-h-screen bg-slate-50 p-6"><section className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 space-y-4"><h1 className="text-2xl font-bold">SEACOM 2026 — Confirmar presença</h1><p>Para confirmar sua presença, permita o acesso à localização do dispositivo e esteja no local do evento: BR-364, Km 04 — Distrito Industrial, Rio Branco — AC, 69920-900.</p>{message&&<p role="status" className="bg-indigo-50 rounded-lg p-3">{message}</p>}{!session?<form onSubmit={login} className="space-y-3"><p>Entre com o e-mail e a senha da sua inscrição.</p><input required type="email" className="border rounded-lg p-3 w-full" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" className="border rounded-lg p-3 w-full" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy||!client} className="bg-indigo-700 text-white rounded-lg p-3 w-full">Entrar</button></form>:<><p>Conectado: <strong>{session.user.email}</strong></p><button disabled={busy||locating} onClick={checkin} className="bg-indigo-700 text-white rounded-lg p-3 w-full">Confirmar presença</button><button onClick={()=>client.auth.signOut()} className="underline">Trocar conta</button></>}<a href="/" className="block underline text-indigo-700">Voltar ao site</a></section></main>
}
