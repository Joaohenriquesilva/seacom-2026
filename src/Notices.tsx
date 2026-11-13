import React, { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { supabase } from './lib/supabase';

type Notice = {
  id: string;
  title: string;
  file_path: string;
  position: number;
  active: boolean;
  revision: string;
};

const table = () => supabase.from('seacom_notices');
const bucket = () => supabase.storage.from('seacom-notices');
const ordered = () => table().select('*').order('position').order('title').order('id');
const field = 'block w-full rounded-xl border border-slate-300 bg-surface p-2';
const button = 'rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-50';

export function PublicNotices() {
  const [rows, setRows] = useState<(Notice & { url?: string })[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const { data, error } = await ordered().eq('active', true);
        if (error) throw error;
        const documents = (data ?? []) as Notice[];
        if (!documents.length) {
          if (current) {
            setRows([]);
            setError('');
          }
          return;
        }
        const { data: signed, error: signError } = await bucket().createSignedUrls(
          documents.map(doc => doc.file_path), 900
        );
        if (signError) throw signError;
        const urls = new Map(signed?.map(item => [item.path, item.signedUrl]));
        if (current) {
          setRows(documents.map(doc => ({ ...doc, url: urls.get(doc.file_path) })));
          setError('');
        }
      } catch {
        if (current) setError('Não foi possível carregar os PDFs. Tente recarregar a página.');
      }
    }
    void load();
    const refresh = window.setInterval(load, 10 * 60 * 1000);
    window.addEventListener('focus', load);
    return () => {
      current = false;
      window.clearInterval(refresh);
      window.removeEventListener('focus', load);
    };
  }, []);

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Editais e Avisos</h1>
      {error && <p role="alert">{error}</p>}
      {!error && rows === null && <p role="status">Carregando documentos…</p>}
      {!error && rows?.length === 0 && <p>Nenhum documento publicado.</p>}
      {!!rows?.length && <ul className="space-y-3">
        {rows.map(doc => <li key={doc.id} className="rounded-2xl border border-slate-200 bg-surface">
          {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl p-4 font-semibold text-indigo-700 hover:bg-indigo-50">
            <FileText aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{doc.title}</span>
            <span className="sr-only"> (PDF, abre em nova guia)</span>
            <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
          </a> : <p className="break-words p-4">{doc.title} · PDF indisponível</p>}
        </li>)}
      </ul>}
    </section>
  );
}

const emptyDraft = { title: '', position: '0', active: false };

export function NoticesAdmin() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  async function refresh() {
    const { data, error } = await ordered();
    if (error) throw error;
    setRows(data ?? []);
  }

  useEffect(() => {
    refresh().catch(error => setMessage(error.message)).finally(() => setBusy(false));
  }, []);

  function edit(row: Notice | null) {
    setEditing(row);
    setDraft(row ? { title: row.title, position: String(row.position), active: row.active } : emptyDraft);
    setFile(null);
    setFileKey(value => value + 1);
  }

  async function cleanup(path: string) {
    const { error } = await bucket().remove([path]);
    return !error;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    let stagedPath: string | undefined;
    try {
      const title = draft.title.trim();
      const position = Number(draft.position);
      if (!title || !Number.isInteger(position) || position < 0 || position > 2147483647) {
        throw new Error('Informe o texto do link e uma posição inteira válida.');
      }
      let path = editing?.file_path;
      if (file) {
        const signature = await file.slice(0, 5).text();
        if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf') ||
            signature !== '%PDF-' || file.size > 10 * 1024 * 1024) {
          throw new Error('Selecione um PDF válido de até 10 MB.');
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Entre novamente no painel para enviar o arquivo.');
        path = user.id + '/' + crypto.randomUUID() + '.pdf';
        stagedPath = path;
        const { error } = await bucket().upload(path, file, { contentType: 'application/pdf', upsert: false });
        if (error) throw error;
      }
      if (!path) throw new Error('Selecione o arquivo PDF.');
      const payload = { title, position, active: draft.active, file_path: path, revision: crypto.randomUUID() };
      const operation = editing
        ? table().update(payload).eq('id', editing.id).eq('revision', editing.revision)
        : table().insert(payload);
      const { data, error } = await operation.select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('O documento foi alterado em outra sessão. Reabra o item antes de salvar.');
      stagedPath = undefined;
      const removed = !editing || editing.file_path === path || await cleanup(editing.file_path);
      edit(null);
      setMessage(removed ? 'Documento salvo.' : 'Documento salvo. O PDF anterior precisa ser removido no Storage.');
    } catch (error) {
      if (stagedPath) await cleanup(stagedPath);
      setMessage('Não foi possível confirmar o salvamento. ' + (error as Error).message);
    } finally {
      try { await refresh(); } catch { setMessage(value => value + ' Recarregue o painel para atualizar a lista.'); }
      setBusy(false);
    }
  }

  async function remove(row: Notice) {
    if (busy || !window.confirm('Excluir definitivamente “' + row.title + '”?')) return;
    setBusy(true);
    try {
      const { data, error } = await table().delete().eq('id', row.id).eq('revision', row.revision)
        .select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('O documento foi alterado em outra sessão.');
      if (editing?.id === row.id) edit(null);
      setMessage(await cleanup(row.file_path) ? 'Documento excluído.' :
        'Documento excluído da lista. Remova o PDF restante no Storage.');
    } catch (error) {
      setMessage('Não foi possível confirmar a exclusão. ' + (error as Error).message);
    } finally {
      try { await refresh(); } catch { setMessage(value => value + ' Recarregue o painel para atualizar a lista.'); }
      setBusy(false);
    }
  }

  return <section className="space-y-4" aria-labelledby="notices-admin">
    <h2 id="notices-admin" className="text-lg font-bold">Editais e Avisos</h2>
    {message && <p role="status">{message}</p>}
    <form onSubmit={save} className="rounded-xl border p-4">
      <fieldset disabled={busy} className="space-y-3">
        <legend className="font-semibold">{editing ? 'Editar documento' : 'Adicionar documento'}</legend>
        <label className="block">Texto do link
          <input required maxLength={200} className={field} value={draft.title}
            onChange={e => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label className="block">Posição (menor número primeiro)
          <input type="number" required min={0} max={2147483647} className={field} value={draft.position}
            onChange={e => setDraft({ ...draft, position: e.target.value })} />
        </label>
        <label className="block">{editing ? 'Substituir PDF (opcional)' : 'Arquivo PDF'} · até 10 MB
          <input key={fileKey} type="file" accept=".pdf,application/pdf" required={!editing} className={field}
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />
          Publicar na página
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-xl bg-indigo-700 px-4 py-2 text-white">Salvar documento</button>
          {editing && <button type="button" className={button} onClick={() => edit(null)}>Cancelar edição</button>}
        </div>
      </fieldset>
    </form>
    <ul className="space-y-2">
      {rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
        <div className="min-w-0 break-words"><strong>{row.title}</strong>
          <p className="text-sm">Posição {row.position} · {row.active ? 'Publicado' : 'Inativo'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={button} onClick={() => edit(row)}>Editar</button>
          <button type="button" disabled={busy} className={button} onClick={() => remove(row)}>Excluir</button>
        </div>
      </li>)}
    </ul>
  </section>;
}
