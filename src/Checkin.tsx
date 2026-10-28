import React,{useEffect,useRef,useState} from 'react';

type Position={latitude:number;longitude:number;accuracy:number};
const OUTSIDE='Usuário Não Presente no Local';
const DENIED='Localização exata é necessária para validar inscrição';

export default function Checkin(){
 const [client,setClient]=useState<any>(null),[session,setSession]=useState<any>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[position,setPosition]=useState<Position|null>(null),[locating,setLocating]=useState(false),[showLocationPopup,setShowLocationPopup]=useState(false);
 const clientRef=useRef<any>(null),locationRequestRef=useRef(0);
 const id=new URLSearchParams(window.location.search).get('checkin')||'';
 async function locationDenied(){
  setPosition(null);setMessage('');setShowLocationPopup(true);setSession(null);
  // A localização é obrigatória: encerra a sessão antes de voltar ao formulário.
  try{await clientRef.current?.auth.signOut()}catch{}
 }
 function requestLocation(){
  const requestId=++locationRequestRef.current;
  setPosition(null);setLocating(true);setMessage('');
  if(!window.isSecureContext||!navigator.geolocation){setLocating(false);setMessage('Ative a localização em um navegador com HTTPS para validar a presença.');return;}
  navigator.geolocation.getCurrentPosition(
   p=>{if(requestId!==locationRequestRef.current)return;setPosition({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy});setMessage('');setLocating(false)},
   e=>{if(requestId!==locationRequestRef.current)return;setLocating(false);if(e.code===1){void locationDenied()}else setMessage(e.code===3?'Não foi possível obter a localização a tempo. Tente novamente.':'Não foi possível identificar sua localização. Ative o GPS e tente novamente.')},
   {enableHighAccuracy:true,timeout:20000,maximumAge:0}
  );
 }
 useEffect(()=>{let active=true;let sub:any;(async()=>{try{const {supabase:c}=await import('./lib/supabase');if(!active)return;clientRef.current=c;setClient(c);const {data}=await c.auth.getSession();if(active)setSession(data.session);const {data:a}=c.auth.onAuthStateChange((_e:any,s:any)=>{if(active)setSession(s)});sub=a.subscription}catch(e:any){if(active)setMessage(e.message)}})();requestLocation();return()=>{active=false;locationRequestRef.current++;sub?.unsubscribe()}},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(!client||busy)return;setBusy(true);setMessage('');const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setBusy(false);if(error){setMessage(error.message);return;}requestLocation()}
 async function checkin(){if(!client||busy||locating)return;if(!position){requestLocation();return;}setBusy(true);try{const {data,error}=await client.rpc('seacom_checkin_local',{p_activity_id:id,p_latitude:position.latitude,p_longitude:position.longitude,p_accuracy:position.accuracy});if(error){setMessage(/fora do local|localização fora|localizacao fora/i.test(error.message)?OUTSIDE:error.message)}else setMessage(data||'Presença confirmada.')}catch{setMessage('Não foi possível validar a presença. Tente novamente.')}finally{setBusy(false)}}
 return <main className="min-h-screen bg-slate-50 p-6"><section className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 space-y-4"><h1 className="text-2xl font-bold">SEACOM 2026 — Confirmar presença</h1><p>Para confirmar sua presença, permita o acesso à localização do dispositivo e esteja no local do evento: BR-364, Km 04 — Distrito Industrial, Rio Branco — AC, 69920-900.</p>{message&&<p role="status" className="bg-indigo-50 rounded-lg p-3">{message}</p>}{!session?<form onSubmit={login} className="space-y-3"><p>Entre com o e-mail e a senha da sua inscrição.</p><input required type="email" className="border rounded-lg p-3 w-full" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" className="border rounded-lg p-3 w-full" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy||!client} className="bg-indigo-700 text-white rounded-lg p-3 w-full">Entrar</button></form>:<><p>Conectado: <strong>{session.user.email}</strong></p><button disabled={busy||locating} onClick={checkin} className="bg-indigo-700 text-white rounded-lg p-3 w-full">Confirmar presença</button><button onClick={()=>client.auth.signOut()} className="underline">Trocar conta</button></>}<a href="/" className="block underline text-indigo-700">Voltar ao site</a></section>{showLocationPopup&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5" role="presentation"><section role="alertdialog" aria-modal="true" aria-labelledby="location-denied-title" aria-describedby="location-denied-description" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></div><h2 id="location-denied-title" className="text-xl font-bold text-center text-slate-900">Localização necessária</h2><p id="location-denied-description" className="text-center text-slate-700">{DENIED}</p><p className="text-center text-sm text-slate-500">Permita a localização precisa nas configurações do navegador, caso a permissão tenha sido bloqueada.</p><button autoFocus onClick={()=>setShowLocationPopup(false)} className="w-full rounded-lg bg-indigo-700 p-3 font-semibold text-white">Voltar ao login</button></section></div>}</main>
}
