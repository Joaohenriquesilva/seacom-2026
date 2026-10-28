import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

/** Tela exclusiva para o retorno de convites do Supabase Auth. */
export default function DefinirSenhaConvite() {
  const [client] = useState(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? supabase : null;
  });
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!client) { setMessage('Serviço de autenticação indisponível. Contate a organização.'); setReady(true); return; }
    let alive = true;
    // O SDK processa os tokens do link (hash ou code) e cria a sessão do convidado.
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session?.user) { setValid(true); setReady(true); setMessage(''); }
    });
    client.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setValid(Boolean(data.session?.user));
      setReady(true);
      if (error) setMessage('Não foi possível validar o convite: ' + error.message);
      else if (!data.session) setMessage('Convite inválido, expirado ou já utilizado. Solicite um novo link à organização.');
    }).catch((err) => { if (alive) { setReady(true); setMessage(String(err)); } });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [client]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!client || !valid) return;
    if (password.length < 12) { setMessage('A senha deve ter pelo menos 12 caracteres.'); return; }
    if (password !== confirm) { setMessage('As senhas não coincidem.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut();
      // Volta ao login administrativo, sem deixar tokens de convite na URL.
      window.location.replace(`${window.location.origin}/?admin=login`);
    } catch (err: any) {
      setMessage('Não foi possível salvar a senha: ' + (err?.message || 'Tente novamente.'));
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-7 w-full max-w-md space-y-5">
      <div><p className="text-sm font-bold text-indigo-700">SEACOM 2026</p><h1 className="text-2xl font-extrabold text-slate-900">Criar senha de organizador</h1>
      <p className="text-sm text-slate-600 mt-2">Defina sua senha para acessar o painel administrativo. Depois você será direcionado ao login.</p></div>
      {!ready ? <p>Validando convite...</p> : valid ? <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Nova senha<input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="block text-sm font-medium">Confirmar senha<input type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
        <p className="text-xs text-slate-600">Use pelo menos 12 caracteres. Não compartilhe sua senha com a organização.</p>
        <button type="submit" disabled={busy} className="w-full bg-indigo-700 text-white font-semibold rounded-xl p-3 disabled:opacity-60">{busy?'Salvando...':'Salvar senha'}</button>
      </form> : <a href="/?admin=login" className="inline-block text-indigo-700 underline">Ir para o login administrativo</a>}
      {message && <p role="alert" className="bg-amber-50 text-amber-900 p-3 rounded-xl text-sm">{message}</p>}
    </section>
  </main>;
}
