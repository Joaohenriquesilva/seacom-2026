import React, { useState } from 'react';
import { createParticipantClient } from './lib/participantAuth';

type Registration = { nome: string; protocolo: string; situacao: string; atividades: string[] };
const statusLabels: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendente', cancelled: 'Cancelada' };
const input = 'mt-1 w-full px-3.5 py-2.5 rounded-xl border text-sm';
const button = 'w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60';

export default function ConsultarInscricao() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<Registration[]>([]);

  function changeForm(next: boolean) {
    setRecovering(next);
    setPassword('');
    setMessage('');
    setRows([]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const address = email.trim().toLowerCase();
    setBusy(true);
    setRows([]);
    setMessage('');

    try {
      if (recovering) {
        if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
          setMessage('Email invalido');
          return;
        }
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const response = await fetch(new URL('/functions/v1/seacom-recover-participant', url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: key },
          body: JSON.stringify({ email: address }),
        }).catch(() => { throw new Error('Não foi possível acessar o serviço de recuperação agora. Tente novamente mais tarde.'); });
        const { code } = await response.json().catch(() => ({}));
        if (response.ok && code === 'sent') setMessage('Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e o spam.');
        else if (code === 'invalid_email') setMessage('Email invalido');
        else if (code === 'rate_limit') setMessage('Aguarde alguns instantes e tente novamente.');
        else throw new Error('Não foi possível enviar o link agora. Tente novamente mais tarde.');
        return;
      }

      const client = createParticipantClient();
      const { error: loginError } = await client.auth.signInWithPassword({ email: address, password });
      if (loginError?.code === 'invalid_credentials') throw new Error('E-mail ou senha incorretos.');
      if (loginError?.code === 'email_not_confirmed') throw new Error('Confirme seu e-mail antes de entrar.');
      if (loginError) throw new Error('Não foi possível entrar agora. Tente novamente em instantes.');
      try {
        const { data, error } = await client.rpc('seacom_my_registrations');
        if (error) throw new Error('Não foi possível consultar suas inscrições agora.');
        setRows(data || []);
        if (!data?.length) setMessage('Nenhuma inscrição encontrada para esta conta.');
      } finally {
        await client.auth.signOut({ scope: 'local' }).catch(() => {});
      }
    } catch (error) {
      setMessage(error instanceof Error && error.name === 'Error'
        ? error.message : 'Serviço indisponível. Tente novamente em instantes.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  }

  return <section className="bg-surface rounded-3xl border p-6 shadow-sm space-y-4" aria-labelledby="consulta-inscricao">
    <h3 id="consulta-inscricao" className="text-sm font-extrabold text-slate-900">
      {recovering ? 'Redefinir senha' : 'Consultar Inscrição'}
    </h3>
    <form onSubmit={submit} noValidate={recovering} className="space-y-3">
      <label className="block text-xs font-semibold">E-mail cadastrado
        <input type="email" autoComplete="email" required maxLength={254} className={input} value={email}
          disabled={busy} onChange={event => { setEmail(event.target.value); setMessage(''); setRows([]); }} />
      </label>
      {!recovering && <label className="block text-xs font-semibold">Senha
        <input type="password" autoComplete="current-password" required className={input} value={password}
          disabled={busy} onChange={event => setPassword(event.target.value)} />
      </label>}
      <button type="submit" className={button} disabled={busy}>
        {busy ? 'Aguarde…' : recovering ? 'Enviar link de recuperação' : 'Consultar inscrição'}
      </button>
      <button type="button" disabled={busy} className="text-xs font-semibold text-indigo-700 underline"
        onClick={() => changeForm(!recovering)}>
        {recovering ? 'Voltar à consulta' : 'Esqueci minha senha'}
      </button>
    </form>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    {rows.length > 0 && <div className="space-y-2" aria-live="polite">
      {rows.map(row => <div key={row.protocolo} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
        <p className="font-bold text-emerald-900">{row.nome}</p>
        <p className="font-mono font-bold text-emerald-800">{row.protocolo}</p>
        <p>{statusLabels[row.situacao] || row.situacao}</p>
        {!!row.atividades.length && <ul className="list-disc pl-4">{row.atividades.map((title, index) =>
          <li key={index}>{title}</li>
        )}</ul>}
      </div>)}
    </div>}
  </section>;
}
