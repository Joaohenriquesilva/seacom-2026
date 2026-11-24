import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type CheckinActivity = { id: string; title: string; address: string | null };
type Settings = { default_address: string | null; activities: CheckinActivity[] };
type AddressMatch = { address: string; latitude: number; longitude: number };

export default function LocalPresencaAdmin() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activityId, setActivityId] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<AddressMatch[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data, error } = await supabase.rpc('seacom_get_checkin_settings');
      if (!mounted) return;
      if (error) setMessage('Não foi possível carregar os locais: ' + error.message);
      else setSettings(data);
    })();
    return () => { mounted = false; };
  }, []);

  const activity = settings?.activities.find(item => item.id === activityId);
  const currentAddress = activity?.address || settings?.default_address;

  function resetSearch(value = '') {
    setQuery(value);
    setMatches([]);
    setSelected(null);
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !settings || query.trim().length < 3) return;
    setBusy(true);
    setMatches([]);
    setSelected(null);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('seacom-find-checkin-address', {
        body: { address: query.trim() },
      });
      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        throw new Error(body?.error || error.message);
      }
      setMatches(data.results);
      if (data.results.length === 1) setSelected(0);
      if (!data.results.length) setMessage('Endereço não encontrado. Tente incluir número, bairro, cidade e estado.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(location: AddressMatch | null) {
    if (busy || !settings || (!location && !activity?.address)) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('seacom_set_checkin_location', {
        p_activity_id: activityId || null,
        p_address: location?.address ?? null,
        p_latitude: location?.latitude ?? null,
        p_longitude: location?.longitude ?? null,
      });
      if (error) throw error;
      const address = location?.address ?? null;
      setSettings(activityId
        ? { ...settings, activities: settings.activities.map(item => item.id === activityId ? { ...item, address } : item) }
        : { ...settings, default_address: address });
      resetSearch();
      setMessage(location ? 'Local de confirmação salvo.' : 'A atividade voltou a usar o local padrão.');
    } catch (error) {
      setMessage('Não foi possível salvar o local: ' + (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-4">
    <h2 className="text-xl font-bold">Locais de confirmação de presença</h2>
    {message && <p role="status" className="rounded-lg bg-indigo-50 p-3 text-sm">{message}</p>}
    {settings && <>
      <label className="block text-sm">Aplicar a
        <select className="block w-full rounded-lg border p-2" disabled={busy} value={activityId}
          onChange={event => { setActivityId(event.target.value); resetSearch(); setMessage(''); }}>
          <option value="">Local padrão do evento</option>
          {settings.activities.map(item => <option key={item.id} value={item.id}>{item.title}{item.address ? ' (local próprio)' : ''}</option>)}
        </select>
      </label>
      <p className="text-sm">
        {activity && !activity.address ? 'Usa o local padrão. ' : ''}
        {currentAddress || 'Nenhum endereço exibido. Se já havia coordenadas cadastradas, elas continuam em uso.'}
      </p>
      <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
        <label className="min-w-60 flex-1 text-sm">Endereço
          <input className="block w-full rounded-lg border p-2" required minLength={3} maxLength={500}
            placeholder="Rua, número, bairro, cidade e estado" value={query} disabled={busy}
            onChange={event => resetSearch(event.target.value)} />
        </label>
        <button disabled={busy || query.trim().length < 3} className="rounded-lg border px-4 py-2 disabled:opacity-50">Buscar endereço</button>
      </form>
      {matches.length > 0 && <fieldset disabled={busy} className="space-y-2">
        <legend className="font-semibold">Confira o local encontrado</legend>
        {matches.map((match, index) => <label key={index} className="flex gap-2 text-sm">
          <input type="radio" name="checkin-address" checked={selected === index} onChange={() => setSelected(index)} />
          {match.address}
          <a className="underline text-indigo-700" href={'https://www.openstreetmap.org/?mlat=' + match.latitude + '&mlon=' + match.longitude + '#map=18/' + match.latitude + '/' + match.longitude} target="_blank" rel="noreferrer">Ver no mapa</a>
        </label>)}
        <button type="button" disabled={busy || selected === null} onClick={() => selected !== null && void save(matches[selected])}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-white disabled:opacity-50">Salvar local</button>
      </fieldset>}
      {activity?.address && <button type="button" disabled={busy} onClick={() => void save(null)}
        className="rounded-lg border px-4 py-2">Voltar a usar o local padrão</button>}
      <p className="text-xs text-slate-600">Busca por <a href="https://www.geoapify.com/" className="underline">Geoapify</a> · Dados © <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap</a></p>
    </>}
  </section>;
}
