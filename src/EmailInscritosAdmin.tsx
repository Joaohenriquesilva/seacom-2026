import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type Activity = { id: string; title: string; starts_at: string };
type Preview = { count: number; audience: string };
const field = 'mt-1 w-full rounded-xl border px-3 py-2';
const button = 'rounded-xl bg-indigo-700 px-4 py-2 text-white font-semibold disabled:opacity-50';
const date = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Rio_Branco', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

async function notice(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Entre novamente no painel.');
  const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/seacom-send-participant-notice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: 'Bearer ' + session.access_token,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'A função de envio está indisponível.');
  return result;
}

export default function EmailInscritosAdmin() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activity, setActivity] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [uncertain, setUncertain] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.from('activities').select('id,title,starts_at').order('starts_at');
      if (!active) return;
      if (error) setStatus('Não foi possível carregar as atividades.');
      else setActivities(data || []);
    }
    void load();
    return () => { active = false; };
  }, []);

  async function review(event: React.FormEvent) {
    event.preventDefault();
    if (busy || uncertain || !subject.trim() || !message.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const result: Preview = await notice({ action: 'count', activity });
      if (result.count) setPreview(result);
      else setStatus('Nenhum inscrito confirmado com e-mail válido para este público.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível conferir o público.');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!preview || busy || uncertain) return;
    setBusy(true);
    setStatus('');
    try {
      const result = await notice({
        action: 'send', activity, subject, message, audience: preview.audience, requestId: crypto.randomUUID(),
      });
      setStatus(`${result.accepted} de ${result.total} e-mails aceitos pelo Brevo.${result.error ? ' ' + result.error : ''}`);
      setUncertain(!!result.error);
      if (!result.error) { setSubject(''); setMessage(''); }
    } catch (error) {
      setStatus((error instanceof Error ? error.message + ' ' : '') + 'Confira o histórico no Brevo antes de tentar novamente.');
      setUncertain(true);
    } finally {
      setPreview(null);
      setBusy(false);
    }
  }

  return <section className="max-w-3xl space-y-4">
    <h2 className="text-lg font-bold">E-mails aos inscritos</h2>
    <form className="space-y-4" onSubmit={review}>
      <fieldset className="space-y-4" disabled={busy || !!preview || uncertain}>
        <label className="block">Destinatários
          <select className={field} value={activity} onChange={e => setActivity(e.target.value)}>
            <option value="all">Todos os inscritos confirmados</option>
            {activities.map(item => <option key={item.id} value={item.id}>
              {item.title} · {item.starts_at ? date.format(new Date(item.starts_at)) : 'Horário a definir'}
            </option>)}
          </select>
        </label>
        <label className="block">Assunto
          <input className={field} required maxLength={160} value={subject} onChange={e => setSubject(e.target.value)} />
        </label>
        <label className="block">Mensagem
          <textarea className={field} required rows={9} maxLength={10000} value={message} onChange={e => setMessage(e.target.value)} />
        </label>
        {!preview && <button className={button} type="submit">{busy ? 'Aguarde…' : 'Revisar envio'}</button>}
      </fieldset>
    </form>
    {preview && <section className="space-y-3 rounded-xl border p-4" aria-label="Revisão do envio">
      <p><strong>{preview.count}</strong> {preview.count === 1 ? 'destinatário' : 'destinatários'}. Cada endereço recebe uma única cópia.</p>
      <p className="font-bold break-words">{subject}</p>
      <p className="whitespace-pre-wrap break-words">{message}</p>
      <button className={button} type="button" disabled={busy} onClick={send}>{busy ? 'Enviando…' : 'Confirmar envio'}</button>
      <button className="ml-3 underline" type="button" disabled={busy} onClick={() => setPreview(null)}>Voltar à edição</button>
    </section>}
    {status && <p role="status">{status}</p>}
    {uncertain && <button type="button" className="underline" onClick={() => setUncertain(false)}>Já conferi o histórico</button>}
  </section>;
}
