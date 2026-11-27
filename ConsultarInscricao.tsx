import React, { useState } from 'react';
import { createParticipantClient } from './lib/participantAuth';

type Option = { id: string; title: string; starts_at: string; selected: boolean; attended: boolean };
const localTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Rio_Branco', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

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

  const [session, setSession] = useState<ReturnType<typeof createParticipantClient> | null>(null);
  const [editing, setEditing] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  async function loadActivities(protocol: string, client = session) {
    if (!client) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await client.rpc('seacom_registration_options', { p_protocol: protocol });
      if (error || !data?.length) throw new Error();
      setOptions(data);
      setSelected(data.filter((item: Option) => item.selected).map((item: Option) => item.id));
      setEditing(protocol);
    } catch {
      setMessage('Não foi possível carregar as atividades. Tente novamente ou entre de novo.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!session || busy || !selected.length) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await session.rpc('seacom_update_registration_activities', {
        p_protocol: editing, p_original: options.filter(item => item.selected).map(item => item.id),
        p_selected: selected,
      });
      if (error) {
        setMessage(error.code === 'P0001' ? error.message : 'Não foi possível confirmar a alteração. Consulte sua inscrição novamente.');
        return;
      }
      setRows(rows => rows.map(row => row.protocolo === editing ? { ...row, atividades: data } : row));
      setEditing('');
      await loadActivities(editing);
      setMessage(previous => previous || 'Atividades atualizadas. Seu protocolo continua o mesmo.');
    } catch {
      setMessage('Falha de conexão. Consulte sua inscrição novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await session?.auth.signOut({ scope: 'local' });
    } finally {
      setSession(null);
      setEditing('');
      setOptions([]);
      setSelected([]);
      setEmail('');
      changeForm(false);
      setBusy(false);
    }
  }

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
        if (data?.length) {
          setSession(client);
          const active = (data as Registration[]).find(row => row.situacao !== 'cancelled');
          if (active) await loadActivities(active.protocolo, client);
        }
        else {
          await client.auth.signOut({ scope: 'local' });
          setMessage('Nenhuma inscrição encontrada para esta conta.');
        }
      } catch (error) {
        await client.auth.signOut({ scope: 'local' }).catch(() => {});
        throw error;
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
    <h3 tabIndex={-1} id="consulta-inscricao" className="text-sm font-extrabold text-slate-900">
      {recovering ? 'Redefinir senha' : 'Minha inscrição'}
    </h3>
    {!session && <form onSubmit={submit} noValidate={recovering} className="space-y-3">
      <label className="block text-xs font-semibold">E-mail cadastrado
        <input type="email" autoComplete="email" required maxLength={254} className={input} value={email}
          disabled={busy} onChange={event => { setEmail(event.target.value); setMessage(''); setRows([]); }} />
      </label>
      {!recovering && <label className="block text-xs font-semibold">Senha
        <input type="password" autoComplete="current-password" required className={input} value={password}
          disabled={busy} onChange={event => setPassword(event.target.value)} />
      </label>}
      <button type="submit" className={button} disabled={busy}>
        {busy ? 'Aguarde…' : recovering ? 'Enviar link de recuperação' : 'Acessar minha inscrição'}
      </button>
      <button type="button" disabled={busy} className="text-xs font-semibold text-indigo-700 underline"
        onClick={() => changeForm(!recovering)}>
        {recovering ? 'Voltar à consulta' : 'Esqueci minha senha'}
      </button>
    </form>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    {rows.length > 0 && <div className="space-y-2" aria-live="polite">
      {rows.map(row => <div key={row.protocolo} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
        <p className="font-bold text-emerald-900">{row.nome}</p>
        <p className="font-mono font-bold text-emerald-800">{row.protocolo}</p>
        <p>{statusLabels[row.situacao] || row.situacao}</p>
        {editing !== row.protocolo && !!row.atividades.length && <ul className="list-disc pl-4">{row.atividades.map((title, index) =>
          <li key={index}>{title}</li>
        )}</ul>}
        {row.situacao !== 'cancelled' && (editing === row.protocolo ? <fieldset disabled={busy} className="space-y-2 pt-3">
          <legend className="font-bold">Editar atividades</legend>
          {[true, false].map(enrolled => {
            const group = options.filter(item => item.selected === enrolled);
            return <section key={String(enrolled)} className={enrolled ? 'rounded-xl border border-emerald-200 bg-emerald-100 p-4' : 'rounded-xl border bg-surface p-4'}>
              <h4 className="mb-2 text-sm font-bold">{enrolled ? 'Minhas atividades inscritas' : 'Outras atividades disponíveis'}</h4>
              {!group.length && <p>{enrolled ? 'Nenhuma atividade inscrita.' : 'Nenhuma outra atividade disponível.'}</p>}
              {group.map(item => <label key={item.id} className="flex gap-2 items-start py-2">
                <input type="checkbox" checked={selected.includes(item.id)} disabled={item.attended && item.selected}
                  onChange={event => setSelected(event.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))}/>
                <span><strong>{item.title}</strong><br/>{localTime.format(new Date(item.starts_at))}
                  {item.attended && ' · Presença registrada'}</span>
              </label>)}
            </section>;
          })}
          {!selected.length && <p>Selecione ao menos uma atividade.</p>}
          <button type="button" className={button} disabled={busy || !selected.length} onClick={save}>
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <button type="button" className="underline" onClick={() => { setEditing(''); setMessage(''); }}>Cancelar edição</button>
        </fieldset> : <button type="button" className="pt-2 font-bold text-indigo-700 underline"
          disabled={busy} onClick={() => loadActivities(row.protocolo)}>Editar atividades</button>)}
      </div>)}
    </div>}
    {session && <button type="button" disabled={busy} onClick={logout} className="text-xs font-bold underline">Sair da conta</button>}
  </section>;
}
